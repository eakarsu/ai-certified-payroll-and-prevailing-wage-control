import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { RequestError } from "./record-policy";

export async function buildPayrollPacket(tx: Prisma.TransactionClient, weeklyPayrollId: string) {
  const weekly = await tx.weeklyPayroll.findUnique({ where: { id: weeklyPayrollId } });
  if (!weekly) throw new RequestError("Weekly payroll not found", 404);
  const project = await tx.payrollProject.findUnique({ where: { id: weekly.payrollProjectId } });
  if (!project) throw new RequestError("Payroll project not found", 404);
  const weekEnd = weekly.weekEnding;
  const weekStart = new Date(weekEnd.getTime() - 6 * 86400000);
  const [rules, determinations, workers, timecards, payrollLines, fringeContributions, classificationExceptions, documentRequirements] = await Promise.all([
    tx.ruleVersion.findMany({ where: { payrollProjectId: project.id }, orderBy: { id: "asc" } }),
    tx.wageDetermination.findMany({ where: { payrollProjectId: project.id }, orderBy: { id: "asc" } }),
    tx.worker.findMany({ where: { payrollProjectId: project.id }, orderBy: { id: "asc" } }),
    tx.timecard.findMany({ where: { payrollProjectId: project.id, workDate: { gte: weekStart, lte: weekEnd } }, orderBy: { id: "asc" } }),
    tx.payrollLine.findMany({ where: { payrollProjectId: project.id, weeklyPayrollId }, orderBy: { id: "asc" } }),
    tx.fringeContribution.findMany({ where: { payrollProjectId: project.id, periodEnding: { gte: weekStart, lte: weekEnd } }, orderBy: { id: "asc" } }),
    tx.classificationException.findMany({ where: { payrollProjectId: project.id }, orderBy: { id: "asc" } }),
    tx.documentRequirement.findMany({ where: { payrollProjectId: project.id }, orderBy: { id: "asc" } }),
  ]);
  return { weekly, project, weekStart, rules, determinations, workers, timecards, payrollLines, fringeContributions, classificationExceptions, documentRequirements,
    sourceAuthority: "Operator-supplied records with local human review. Agency source authenticity and external packet acceptance have not been verified." };
}

export type PayrollPacketSnapshot = Awaited<ReturnType<typeof buildPayrollPacket>>;
const day = (value: Date) => value.toISOString().slice(0, 10);
const same = (left: string, right: string) => left.trim().toLowerCase() === right.trim().toLowerCase();
function centsForHours(hours: number, rateCents: number) {
  const minutes = hours * 60;
  if (!Number.isSafeInteger(minutes) || minutes < 0 || !Number.isSafeInteger(rateCents) || rateCents < 0)
    throw new RequestError("A timecard has hours that cannot be converted to whole minutes", 422);
  if (!Number.isSafeInteger(minutes * rateCents + 30)) throw new RequestError("Calculated pay exceeds safe cent precision", 422);
  return Math.floor((minutes * rateCents + 30) / 60);
}

export function assessPayrollPacket(snapshot: PayrollPacketSnapshot) {
  const issues: string[] = [];
  const { weekly, project, weekStart, rules, determinations, workers, timecards, payrollLines, classificationExceptions, documentRequirements } = snapshot;
  const rule = rules.find(row => row.status === "Approved" && same(row.jurisdiction, project.jurisdiction) && same(row.version, project.wageDecision) &&
    row.effectiveAt <= weekStart && (!row.expiresAt || row.expiresAt >= weekly.weekEnding) && /^https:\/\/[^\s]+$/i.test(row.sourceUrl));
  if (!rule) issues.push(`No approved, source-linked rule version covers ${day(weekStart)} to ${day(weekly.weekEnding)} for ${project.jurisdiction} / ${project.wageDecision}.`);
  if (weekly.status !== "Approved") issues.push("Weekly payroll record needs two independent human reviews.");
  if (!timecards.length) issues.push("No timecards fall in the packet week.");
  if (!payrollLines.length) issues.push("Link payroll lines to this weekly payroll record.");
  const workerById = new Map(workers.map(row => [row.id, row]));
  for (const card of timecards) {
    const worker = workerById.get(card.workerId);
    if (!worker || worker.status !== "Approved") issues.push(`Timecard ${card.id}: worker is missing or unreviewed.`);
    if (card.status !== "Approved") issues.push(`Timecard ${card.id}: independent review is pending.`);
    if (worker && !same(worker.classification, card.classification)) issues.push(`Timecard ${card.id}: worker and timecard classifications differ.`);
    if (!determinations.some(row => row.status === "Approved" && same(row.version, project.wageDecision) && same(row.classification, card.classification) && row.effectiveAt <= card.workDate))
      issues.push(`Timecard ${card.id}: no approved determination for ${card.classification} effective on ${day(card.workDate)}.`);
    try { centsForHours(card.regularHours + card.overtimeHours, 1); }
    catch { issues.push(`Timecard ${card.id}: hours cannot be represented as whole minutes.`); }
  }
  for (const line of payrollLines) {
    if (line.status !== "Approved") issues.push(`Payroll line ${line.id}: independent review is pending.`);
    if (line.netCents !== line.grossCents - line.deductionsCents) issues.push(`Payroll line ${line.id}: gross minus deductions does not equal net.`);
    if (!timecards.some(card => card.workerId === line.workerId)) issues.push(`Payroll line ${line.id}: no timecard for the worker in this week.`);
  }
  for (const workerId of new Set(timecards.map(card => card.workerId))) {
    const cards = timecards.filter(card => card.workerId === workerId);
    const lines = payrollLines.filter(line => line.workerId === workerId);
    if (!lines.length) issues.push(`Worker ${workerId}: no linked payroll line for this week.`);
    const applicable = cards.map(card => determinations.find(row => row.status === "Approved" && same(row.version, project.wageDecision) && same(row.classification, card.classification) && row.effectiveAt <= card.workDate));
    if (lines.length && applicable.every(Boolean)) {
      try {
        const minimumBase = cards.reduce((sum, card, index) => sum + centsForHours(card.regularHours + card.overtimeHours, applicable[index]!.baseRateCents), 0);
        const requiredFringe = cards.reduce((sum, card, index) => sum + centsForHours(card.regularHours + card.overtimeHours, applicable[index]!.fringeRateCents), 0);
        if (lines.reduce((sum, line) => sum + line.grossCents, 0) < minimumBase) issues.push(`Worker ${workerId}: gross wages are below the straight-time base floor; overtime premium is not yet evaluated.`);
        if (lines.reduce((sum, line) => sum + line.fringePaidCents, 0) < requiredFringe) issues.push(`Worker ${workerId}: recorded fringe is below the entered determination amount.`);
      } catch { issues.push(`Worker ${workerId}: hours or rates cannot be calculated safely.`); }
    }
  }
  for (const exception of classificationExceptions)
    if (!same(exception.status, "Resolved")) issues.push(`Classification exception ${exception.id} is unresolved.`);
  for (const requirement of documentRequirements)
    if (!requirement.evidenceReference?.trim() || requirement.status !== "Approved") issues.push(`Document requirement ${requirement.id} lacks reviewed evidence.`);
  return { issues, ruleVersionId: rule?.id ?? null, calculationScope: "Straight-time base and fringe floors only. Overtime premium, rule applicability, source authenticity and legal compliance require professional review." };
}

export function payrollPacketHash(snapshot: PayrollPacketSnapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}
