import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { authorize } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/request-body";
import { objectBody, RequestError } from "@/lib/record-policy";
import { errorResponse, jsonValue } from "@/lib/record-store";
import { assessPayrollPacket, buildPayrollPacket, payrollPacketHash } from "@/lib/payroll-packet";

export async function GET(request: NextRequest) {
  try {
    await authorize();
    const weeklyPayrollId = request.nextUrl.searchParams.get("weeklyPayrollId");
    if (!weeklyPayrollId || weeklyPayrollId.length > 100) throw new RequestError("Select a weekly payroll record", 422);
    return Response.json({ packets: await prisma.payrollPacket.findMany({ where: { weeklyPayrollId }, orderBy: { createdAt: "desc" }, take: 25 }) });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await authorize("write");
    const body = objectBody(await readJson(request, 10000));
    if (typeof body.weeklyPayrollId !== "string" || !body.weeklyPayrollId || body.weeklyPayrollId.length > 100) throw new RequestError("Select a weekly payroll record", 422);
    const packet = await prisma.$transaction(async tx => {
      const snapshot = await buildPayrollPacket(tx, body.weeklyPayrollId as string);
      const snapshotHash = payrollPacketHash(snapshot);
      const existing = await tx.payrollPacket.findUnique({ where: { weeklyPayrollId_snapshotHash: { weeklyPayrollId: snapshot.weekly.id, snapshotHash } } });
      if (existing) return existing;
      const assessment = assessPayrollPacket(snapshot);
      const row = await tx.payrollPacket.create({ data: { weeklyPayrollId: snapshot.weekly.id, payrollProjectId: snapshot.project.id, snapshot: jsonValue({ ...snapshot, assessment }), snapshotHash, issues: jsonValue(assessment.issues), preparedById: actor.id } });
      await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: "PAYROLL_PACKET_PREPARED", entity: "PayrollPacket", entityId: row.id, detail: JSON.stringify({ weeklyPayrollId: row.weeklyPayrollId, snapshotHash, issueCount: assessment.issues.length, sourceAuthority: snapshot.sourceAuthority }) } });
      return row;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ packet });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await authorize("write");
    const body = objectBody(await readJson(request, 10000));
    if (typeof body.packetId !== "string" || !body.packetId || body.packetId.length > 100) throw new RequestError("Select a prepared packet", 422);
    if (body.action !== "ACCEPT" && body.action !== "RECORD_RECEIPT") throw new RequestError("Unsupported packet action", 422);
    const packet = await prisma.$transaction(async tx => {
      const prior = await tx.payrollPacket.findUnique({ where: { id: body.packetId as string } });
      if (!prior) throw new RequestError("Packet not found", 404);
      if (body.action === "ACCEPT") {
        if (prior.status !== "PREPARED") throw new RequestError("This packet is no longer awaiting acceptance", 409);
        if (prior.preparedById === actor.id) throw new RequestError("A different reviewer must accept the prepared packet", 403);
        if (typeof body.notes !== "string" || body.notes.trim().length < 20 || body.notes.length > 5000) throw new RequestError("Provide at least 20 characters of review notes", 422);
        if (!Array.isArray(prior.issues) || prior.issues.length) throw new RequestError("Resolve packet issues and prepare a new snapshot before acceptance", 409);
        const current = await buildPayrollPacket(tx, prior.weeklyPayrollId);
        if (payrollPacketHash(current) !== prior.snapshotHash) throw new RequestError("Source records changed; prepare a new packet before acceptance", 409);
        const updated = await tx.payrollPacket.update({ where: { id: prior.id }, data: { status: "ACCEPTED_BY_OPERATOR", acceptedById: actor.id, acceptedAt: new Date(), reviewNotes: body.notes.trim() } });
        await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: "PAYROLL_PACKET_ACCEPTED", entity: "PayrollPacket", entityId: prior.id, detail: JSON.stringify({ snapshotHash: prior.snapshotHash, notes: body.notes, scope: "Operator acceptance of a frozen local packet; no external filing or legal compliance certification" }) } });
        return updated;
      }
      if (prior.status !== "ACCEPTED_BY_OPERATOR" || prior.receiptReference) throw new RequestError("A receipt can be recorded once after operator acceptance", 409);
      if (typeof body.reference !== "string" || body.reference.trim().length < 10 || body.reference.length > 200) throw new RequestError("Enter the external acknowledgement reference", 422);
      if (typeof body.artifactId !== "string" || !body.artifactId) throw new RequestError("Attach the reviewed acknowledgement artifact", 422);
      const artifact = await tx.domainArtifact.findFirst({ where: { id: body.artifactId, subjectEntity: "WeeklyPayroll", subjectId: prior.weeklyPayrollId } });
      if (!artifact?.approvedBy) throw new RequestError("The acknowledgement artifact must be attached to this weekly payroll and reviewed", 409);
      const updated = await tx.payrollPacket.update({ where: { id: prior.id }, data: { status: "RECEIPT_RECORDED_UNVERIFIED", receiptReference: body.reference.trim(), receiptArtifactId: artifact.id, receiptRecordedById: actor.id, receiptRecordedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: actor.id, actorName: actor.name, action: "PAYROLL_PACKET_RECEIPT_RECORDED", entity: "PayrollPacket", entityId: prior.id, detail: JSON.stringify({ reference: body.reference, artifactId: artifact.id, artifactHash: artifact.contentHash, scope: "User-provided acknowledgement; external acceptance not independently verified" }) } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ packet });
  } catch (error) { return errorResponse(error); }
}
