import test from "node:test";
import assert from "node:assert/strict";
import { assessPayrollPacket, payrollPacketHash } from "../src/lib/payroll-packet";
import { parsePayrollExplanations, validatePayrollEvidence } from "../src/lib/payroll-ai-review";

const date = (value: string) => new Date(`${value}T00:00:00Z`);
function packet() {
  return {
    weekly: { id: "week-1", weekEnding: date("2026-10-04"), status: "Approved" },
    project: { id: "project-1", jurisdiction: "NY", wageDecision: "WD-1" },
    weekStart: date("2026-09-28"),
    rules: [{ id: "rule-1", status: "Approved", jurisdiction: "NY", version: "WD-1", effectiveAt: date("2026-01-01"), expiresAt: null, sourceUrl: "https://sam.gov/fixture" }],
    determinations: [{ id: "wd-1", status: "Approved", version: "WD-1", classification: "Electrician", effectiveAt: date("2026-01-01"), baseRateCents: 2500, fringeRateCents: 450 }],
    workers: [{ id: "worker-1", status: "Approved", classification: "Electrician" }],
    timecards: [{ id: "card-1", workerId: "worker-1", status: "Approved", classification: "Electrician", workDate: date("2026-10-02"), regularHours: 8, overtimeHours: 0 }],
    payrollLines: [{ id: "line-1", workerId: "worker-1", status: "Approved", grossCents: 20000, deductionsCents: 1000, netCents: 19000, fringePaidCents: 3600 }],
    fringeContributions: [], classificationExceptions: [], documentRequirements: [],
    sourceAuthority: "Operator-supplied records; source authenticity not externally verified",
  };
}

test("weekly packet detects source, classification and pay evidence gaps before human acceptance", () => {
  const clean = packet();
  assert.deepEqual(assessPayrollPacket(clean as never).issues, []);
  const short = packet(); short.payrollLines[0].grossCents = 19999; short.payrollLines[0].netCents = 18999;
  assert.match(assessPayrollPacket(short as never).issues.join(" "), /straight-time base floor/);
  const wrongRule = packet(); wrongRule.rules[0].jurisdiction = "CA";
  assert.match(assessPayrollPacket(wrongRule as never).issues.join(" "), /No approved, source-linked rule/);
  assert.notEqual(payrollPacketHash(clean as never), payrollPacketHash(short as never));
});

test("AI exception explanations need applicable rule, determination, timecard and pay citations", () => {
  const rows = [
    { entity: "RuleVersion", record: { id: "rule-1", jurisdiction: "NY", version: "WD-1", status: "Approved", sourceUrl: "https://sam.gov/fixture", effectiveAt: date("2026-01-01") } },
    { entity: "WageDetermination", record: { id: "wd-1", version: "WD-1", classification: "Electrician", status: "Approved", effectiveAt: date("2026-01-01") } },
    { entity: "Timecard", record: { id: "card-1", classification: "Electrician", workDate: date("2026-10-02") } },
    { entity: "PayrollLine", record: { id: "line-1" } },
  ] as never;
  const project = { jurisdiction: "NY", wageDecision: "WD-1" };
  assert.doesNotThrow(() => validatePayrollEvidence(rows, "fringe-discrepancy-explanation", project));
  const explanation = { explanations: [{ issue: "Fringe gap", reason: "Compare recorded paid amount with the cited rate.", citations: ["WageDetermination:wd-1", "Timecard:card-1", "PayrollLine:line-1"] }] };
  assert.equal(parsePayrollExplanations(explanation, rows, "fringe-discrepancy-explanation")?.length, 1);
  assert.throws(() => parsePayrollExplanations({ explanations: [{ ...explanation.explanations[0], citations: ["WageDetermination:wd-1", "Timecard:card-1", "PayrollLine:invented"] }] }, rows, "fringe-discrepancy-explanation"), /invalid source/);
  assert.throws(() => validatePayrollEvidence(rows, "fringe-discrepancy-explanation", { jurisdiction: "CA", wageDecision: "WD-1" }), /approved rule/);
});
