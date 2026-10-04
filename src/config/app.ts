export interface PageConfig {
  label: string;
  href: string;
  description: string;
  entities: string[];
  workflows: string[];
}

export interface EntityConfig {
  name: string;
  label: string;
  fields: Array<{ name: string; kind: "string" | "number" | "boolean" | "date" }>;
}

export interface WorkflowConfig {
  slug: string;
  title: string;
  description: string;
  prompt: string;
  fields: string[];
}

export const appConfig = {
  "slug": "ai-certified-payroll-and-prevailing-wage-control",
  "title": "Certified Payroll and Prevailing Wage Control",
  "tagline": "Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off.",
  "accent": "rose"
};
export const pages: PageConfig[] = [
  {
    "label": "Intake & registers",
    "href": "/registers",
    "description": "Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off.",
    "entities": [
      "PayrollProject",
      "Worker",
      "WageDetermination"
    ],
    "workflows": [
      "classification-evidence-mapping",
      "fringe-discrepancy-explanation"
    ]
  },
  {
    "label": "Operational records",
    "href": "/workflow",
    "description": "Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off.",
    "entities": [
      "Timecard",
      "PayrollLine",
      "FringeContribution"
    ],
    "workflows": [
      "timecard-reconciliation-brief",
      "payroll-packet-draft"
    ]
  },
  {
    "label": "Review & delivery",
    "href": "/delivery",
    "description": "Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off.",
    "entities": [
      "ClassificationException",
      "WeeklyPayroll",
      "Restitution"
    ],
    "workflows": [
      "restitution-follow-up-draft",
      "contractor-correction-request"
    ]
  },
  {
    "label": "Tasks & requirements",
    "href": "/operations",
    "description": "Assignments, versioned rules and document requirements.",
    "entities": [
      "OperationalTask",
      "RuleVersion",
      "DocumentRequirement"
    ],
    "workflows": [
      "evidence-completeness-review",
      "operations-handoff-draft"
    ]
  }
];
export const entities: Record<string, EntityConfig> = {
  "PayrollProject": {
    "name": "PayrollProject",
    "label": "Payroll Project",
    "fields": [
      {
        "name": "name",
        "kind": "string"
      },
      {
        "name": "contractNumber",
        "kind": "string"
      },
      {
        "name": "jurisdiction",
        "kind": "string"
      },
      {
        "name": "wageDecision",
        "kind": "string"
      },
      {
        "name": "weekEnding",
        "kind": "date"
      },
      {
        "name": "budgetCents",
        "kind": "number"
      },
      {
        "name": "status",
        "kind": "string"
      }
    ]
  },
  "Worker": {
    "name": "Worker",
    "label": "Worker",
    "fields": [
      {
        "name": "name",
        "kind": "string"
      },
      {
        "name": "employeeCode",
        "kind": "string"
      },
      {
        "name": "classification",
        "kind": "string"
      },
      {
        "name": "contractor",
        "kind": "string"
      },
      {
        "name": "employmentType",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "WageDetermination": {
    "name": "WageDetermination",
    "label": "Wage Determination",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "version",
        "kind": "string"
      },
      {
        "name": "classification",
        "kind": "string"
      },
      {
        "name": "baseRateCents",
        "kind": "number"
      },
      {
        "name": "fringeRateCents",
        "kind": "number"
      },
      {
        "name": "effectiveAt",
        "kind": "date"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "Timecard": {
    "name": "Timecard",
    "label": "Timecard",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "workerId",
        "kind": "string"
      },
      {
        "name": "workDate",
        "kind": "date"
      },
      {
        "name": "regularHours",
        "kind": "number"
      },
      {
        "name": "overtimeHours",
        "kind": "number"
      },
      {
        "name": "classification",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "PayrollLine": {
    "name": "PayrollLine",
    "label": "Payroll Line",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "workerId",
        "kind": "string"
      },
      {
        "name": "weeklyPayrollId",
        "kind": "string"
      },
      {
        "name": "grossCents",
        "kind": "number"
      },
      {
        "name": "deductionsCents",
        "kind": "number"
      },
      {
        "name": "fringePaidCents",
        "kind": "number"
      },
      {
        "name": "netCents",
        "kind": "number"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "FringeContribution": {
    "name": "FringeContribution",
    "label": "Fringe Contribution",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "workerId",
        "kind": "string"
      },
      {
        "name": "planName",
        "kind": "string"
      },
      {
        "name": "contributionCents",
        "kind": "number"
      },
      {
        "name": "periodEnding",
        "kind": "date"
      },
      {
        "name": "evidence",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "ClassificationException": {
    "name": "ClassificationException",
    "label": "Classification Exception",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "workerId",
        "kind": "string"
      },
      {
        "name": "reportedClass",
        "kind": "string"
      },
      {
        "name": "requiredClass",
        "kind": "string"
      },
      {
        "name": "resolution",
        "kind": "string"
      },
      {
        "name": "dueAt",
        "kind": "date"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "WeeklyPayroll": {
    "name": "WeeklyPayroll",
    "label": "Weekly Payroll",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "weekEnding",
        "kind": "date"
      },
      {
        "name": "contractor",
        "kind": "string"
      },
      {
        "name": "payrollNumber",
        "kind": "string"
      },
      {
        "name": "attestationNotes",
        "kind": "string"
      },
      {
        "name": "submittedReceipt",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "Restitution": {
    "name": "Restitution",
    "label": "Restitution",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "workerId",
        "kind": "string"
      },
      {
        "name": "owedCents",
        "kind": "number"
      },
      {
        "name": "paidCents",
        "kind": "number"
      },
      {
        "name": "paidAt",
        "kind": "date"
      },
      {
        "name": "receipt",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "OperationalTask": {
    "name": "OperationalTask",
    "label": "Operational Task",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "owner",
        "kind": "string"
      },
      {
        "name": "priority",
        "kind": "string"
      },
      {
        "name": "startAt",
        "kind": "date"
      },
      {
        "name": "dueAt",
        "kind": "date"
      },
      {
        "name": "done",
        "kind": "boolean"
      },
      {
        "name": "notes",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "RuleVersion": {
    "name": "RuleVersion",
    "label": "Rule Version",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "jurisdiction",
        "kind": "string"
      },
      {
        "name": "version",
        "kind": "string"
      },
      {
        "name": "effectiveAt",
        "kind": "date"
      },
      {
        "name": "expiresAt",
        "kind": "date"
      },
      {
        "name": "sourceUrl",
        "kind": "string"
      },
      {
        "name": "requirementText",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  },
  "DocumentRequirement": {
    "name": "DocumentRequirement",
    "label": "Document Requirement",
    "fields": [
      {
        "name": "title",
        "kind": "string"
      },
      {
        "name": "category",
        "kind": "string"
      },
      {
        "name": "requiredBy",
        "kind": "date"
      },
      {
        "name": "sourceReference",
        "kind": "string"
      },
      {
        "name": "evidenceReference",
        "kind": "string"
      },
      {
        "name": "reviewNotes",
        "kind": "string"
      },
      {
        "name": "status",
        "kind": "string"
      },
      {
        "name": "payrollProjectId",
        "kind": "string"
      }
    ]
  }
};
export const workflows: WorkflowConfig[] = [
  {
    "slug": "classification-evidence-mapping",
    "title": "Classification evidence mapping",
    "description": "Classification evidence mapping using selected payroll project records and supplied evidence.",
    "prompt": "Classification evidence mapping for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Map each claimed worker classification to the supplied wage determination, timecard entries and evidence, and flag classifications without supporting records. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "fringe-discrepancy-explanation",
    "title": "Fringe discrepancy explanation",
    "description": "Fringe discrepancy explanation using selected payroll project records and supplied evidence.",
    "prompt": "Fringe discrepancy explanation for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Explain recorded wage and fringe discrepancies against the supplied rates and contributions, cite the affected payroll lines and propose reviewer questions. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "timecard-reconciliation-brief",
    "title": "Timecard reconciliation brief",
    "description": "Timecard reconciliation brief using selected payroll project records and supplied evidence.",
    "prompt": "Timecard reconciliation brief for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Reconcile recorded hours and work dates across the supplied timecards and payroll lines, list unexplained differences and identify missing approvals. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "payroll-packet-draft",
    "title": "Payroll packet draft",
    "description": "Payroll packet draft using selected payroll project records and supplied evidence.",
    "prompt": "Payroll packet draft for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Draft the weekly certified payroll narrative from the selected payroll lines, name every unresolved exception and list the evidence a reviewer must confirm before sign-off. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "restitution-follow-up-draft",
    "title": "Restitution follow-up draft",
    "description": "Restitution follow-up draft using selected payroll project records and supplied evidence.",
    "prompt": "Restitution follow-up draft for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Draft restitution follow-up from the recorded underpayments, amounts already paid and remaining balance; keep every amount tied to a source record. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "contractor-correction-request",
    "title": "Contractor correction request",
    "description": "Contractor correction request using selected payroll project records and supplied evidence.",
    "prompt": "Contractor correction request for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Draft a correction request describing each exception, its supporting record, the requested correction and the reviewer decision still required. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "evidence-completeness-review",
    "title": "Evidence completeness review",
    "description": "Evidence completeness review using selected payroll project records and supplied evidence.",
    "prompt": "Evidence completeness review for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Review the supplied packet evidence against the listed document requirements, report present and missing sources, and never claim adequacy or approval. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  },
  {
    "slug": "operations-handoff-draft",
    "title": "Operations handoff draft",
    "description": "Operations handoff draft using selected payroll project records and supplied evidence.",
    "prompt": "Operations handoff draft for Certified Payroll and Prevailing Wage Control. Operational scope: Record workers, timecards and wage determinations; calculate wage and fringe obligations from supplied figures; assemble weekly certified payroll with reviewer sign-off. Specific AI scope: Draft an operations handoff covering open tasks, rule versions in effect, unresolved exceptions and the next reviewer action. Produce an editable, source-linked draft for the responsible professional. Distinguish observations, missing evidence and proposed next actions. Do not invent facts, decide legal eligibility, profile individuals, submit externally or invent calibrated probabilities. Use supplied rule versions only.",
    "fields": [
      "objective",
      "sourceContext",
      "applicableRules",
      "knownDiscrepancies",
      "constraints",
      "requestedOutput",
      "optionalReviewerNotes",
      "optionalAdditionalEvidence"
    ]
  }
];
export function findPage(href:string){return pages.find(p=>p.href===href);}
