import { readJson } from "@/lib/request-body";
import { NextRequest } from "next/server";
import { authorize } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { requiresRuleSource, runTool } from "@/lib/domain-engine";
import tools from "@/config/domain-tools.json";
import { errorResponse, jsonValue } from "@/lib/record-store";
import { objectBody, RequestError } from "@/lib/record-policy";
import { createHash } from "node:crypto";

/**
 * Builds the payload returned (and persisted) by POST /api/tools. Rule-backed
 * datasets carry explicit provenance: VERIFIED only when the supplied rule
 * source matched a current, approved RuleVersion row, otherwise UNVERIFIED.
 * Example datasets are never presented as verified.
 */
export function toolResponseResult(
  tool: { id: string; operation: string },
  input: unknown,
  isExample: boolean,
  rule: { id: string } | null,
) {
  const result = runTool(tool.id, input);
  return {
    ...result,
    ...(result.ruleSource
      ? { ruleSourceStatus: rule ? "VERIFIED" : "UNVERIFIED", ruleVersionId: rule?.id ?? null }
      : {}),
    datasetType: isExample === true ? "example" : "user-supplied",
  };
}

export async function GET() {
  try {
    await authorize();
    return Response.json({ tools });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorize("write");
    const body = objectBody(await readJson(request));
    const tool = tools.find(t => t.id === body.tool);
    if (!tool) throw new RequestError("Tool is not enabled for this application", 404);
    const input = objectBody(body.input);
    if (JSON.stringify(input).length > 1000000) throw new RequestError("Dataset exceeds one megabyte", 413);
    let rule: { id: string } | null = null;
    if (requiresRuleSource(tool.operation)) {
      const ruleSource = typeof input.ruleSource === "string" ? input.ruleSource.trim() : "";
      if (!ruleSource) throw new RequestError("A reviewed rule source/version is required", 422);
      if (body.isExample !== true) {
        const now = new Date();
        const matched = await prisma.ruleVersion.findFirst({
          where: {
            AND: [
              { OR: [{ id: ruleSource }, { version: { equals: ruleSource, mode: "insensitive" } }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
              { effectiveAt: { lte: now } },
            ],
          },
          select: { id: true, status: true },
        });
        if (!matched || matched.status.trim().toLowerCase() !== "approved") {
          throw new RequestError("Rule source does not match a current, approved RuleVersion (record id or version); record and review the rule before calculating", 409);
        }
        rule = { id: matched.id };
      }
    }
    const result = toolResponseResult(tool, input, body.isExample === true, rule);
    const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const saved = await prisma.$transaction(async tx => {
      const item = await tx.workflowAnalysis.create({ data: { actorId: user.id, workflow: `tool:${body.tool}`, subjectEntity: "SubmittedDataset", subjectId: hash, input: jsonValue(input), evidence: [], evidenceHash: hash, result: jsonValue(result), model: "deterministic-v1" } });
      await tx.auditLog.create({ data: { actorId: user.id, actorName: user.name, action: "DOMAIN_CALCULATION", entity: "WorkflowAnalysis", entityId: item.id, detail: JSON.stringify({ tool: body.tool, hash, method: "deterministic-v1", ruleVersionId: rule?.id ?? null, ruleSourceStatus: result.ruleSourceStatus ?? null }) } });
      return item;
    });
    return Response.json({ id: saved.id, result, inputHash: hash, computedAt: saved.createdAt });
  } catch (error) {
    return errorResponse(error);
  }
}
