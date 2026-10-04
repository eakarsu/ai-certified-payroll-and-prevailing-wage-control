import { RequestError } from "./record-policy";
import type { Row } from "./record-store";

type Evidence = { entity: string; record: Row };
const targeted = new Set(["classification-evidence-mapping", "fringe-discrepancy-explanation"]);
export function requiresPayrollEvidence(workflow: string) { return targeted.has(workflow); }

export function validatePayrollEvidence(rows: Evidence[], workflow: string, project?: { jurisdiction: string; wageDecision: string }) {
  if (!requiresPayrollEvidence(workflow)) return;
  if (!project) throw new RequestError("Select a payroll project for source-linked analysis", 422);
  const rules = rows.filter(row => row.entity === "RuleVersion" && row.record.status === "Approved" && String(row.record.jurisdiction).trim().toLowerCase() === project.jurisdiction.trim().toLowerCase() && String(row.record.version).trim().toLowerCase() === project.wageDecision.trim().toLowerCase() && /^https:\/\/[^\s]+$/i.test(String(row.record.sourceUrl)));
  const determinations = rows.filter(row => row.entity === "WageDetermination" && row.record.status === "Approved" && String(row.record.version).trim().toLowerCase() === project.wageDecision.trim().toLowerCase());
  const cards = rows.filter(row => row.entity === "Timecard");
  if (!rules.length || !determinations.length || !cards.length)
    throw new RequestError("Select an approved rule version, approved wage determination and timecard before explaining exceptions", 422);
  if (workflow === "fringe-discrepancy-explanation" && !rows.some(row => row.entity === "PayrollLine" || row.entity === "FringeContribution"))
    throw new RequestError("Select a payroll line or fringe contribution alongside the determination and timecard", 422);
  for (const card of cards) {
    const workAt = new Date(String(card.record.workDate));
    if (!Number.isFinite(workAt.getTime())) throw new RequestError("Selected timecard has no valid work date", 422);
    if (!determinations.some(row => String(row.record.classification).trim().toLowerCase() === String(card.record.classification).trim().toLowerCase() && new Date(String(row.record.effectiveAt)) <= workAt))
      throw new RequestError("Every selected timecard needs an applicable approved classification determination", 422);
    if (!rules.some(row => new Date(String(row.record.effectiveAt)) <= workAt && (!row.record.expiresAt || new Date(String(row.record.expiresAt)) >= workAt)))
      throw new RequestError("Every selected timecard needs an approved rule version covering its work date", 422);
  }
}

export function parsePayrollExplanations(payload: unknown, rows: Evidence[], workflow: string) {
  if (!requiresPayrollEvidence(workflow)) return undefined;
  const raw = payload as { explanations?: unknown } | null;
  if (!raw || !Array.isArray(raw.explanations) || !raw.explanations.length || raw.explanations.length > 50)
    throw new RequestError("AI must provide source-linked exception explanations", 502);
  const byCitation = new Map(rows.map(row => [`${row.entity}:${row.record.id}`, row.entity]));
  return raw.explanations.map(value => {
    const row = value as { issue?: unknown; reason?: unknown; citations?: unknown } | null;
    if (!row || typeof row.issue !== "string" || !row.issue.trim() || row.issue.length > 2000 ||
        typeof row.reason !== "string" || !row.reason.trim() || row.reason.length > 5000 ||
        !Array.isArray(row.citations) || row.citations.length < 2 || row.citations.length > 20 ||
        !row.citations.every(id => typeof id === "string" && byCitation.has(id)))
      throw new RequestError("AI exception explanation has invalid source references", 502);
    const types = row.citations.map(id => byCitation.get(id));
    if (!types.includes("WageDetermination") || !types.includes("Timecard") ||
        (workflow === "fringe-discrepancy-explanation" && !types.some(type => type === "PayrollLine" || type === "FringeContribution")))
      throw new RequestError("Every explanation must cite the determination, timecard and relevant pay evidence", 502);
    return { issue: row.issue, reason: row.reason, citations: row.citations as string[] };
  });
}
