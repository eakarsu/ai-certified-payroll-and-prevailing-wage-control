# Certified Payroll and Prevailing Wage Control

Import timecards and wage determinations; calculate classification/fringe exceptions; assemble weekly certified payroll with reviewer sign-off.

## Implemented records

- **Payroll Project**: name, contract Number, jurisdiction, wage Decision, week Ending, budget Cents, status.
- **Worker**: name, employee Code, classification, contractor, employment Type, status.
- **Wage Determination**: title, version, classification, base Rate Cents, fringe Rate Cents, effective At, status.
- **Timecard**: title, work Date, regular Hours, overtime Hours, classification, status.
- **Payroll Line**: title, gross Cents, deductions Cents, fringe Paid Cents, net Cents, status.
- **Fringe Contribution**: title, plan Name, contribution Cents, period Ending, evidence, status.
- **Classification Exception**: title, reported Class, required Class, resolution, due At, status.
- **Weekly Payroll**: title, week Ending, contractor, payroll Number, attestation Notes, submitted Receipt, status.
- **Restitution**: title, owed Cents, paid Cents, paid At, receipt, status.
- **Operational Task**: title, owner, priority, start At, due At, done, notes, status.
- **Rule Version**: title, jurisdiction, version, effective At, expires At, source Url, requirement Text, status.
- **Document Requirement**: title, category, required By, source Reference, evidence Reference, review Notes, status.

## AI workflows

- Classification evidence mapping: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Fringe discrepancy explanation: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Timecard reconciliation brief: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Payroll packet draft: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Restitution follow-up draft: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Contractor correction request: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Evidence completeness review: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.
- Operations handoff draft: source-linked draft, saved history, three real AI input suggestion styles and three complete fictional examples.

## Calculations

- Weekly wage and fringe reconciliation: Compute wages and fringe shortfalls from explicit classifications, minutes, rates and supplied overtime terms. Does not sign or file certified payroll.
- Payroll Project evidence checklist: Check source presence against an explicitly supplied document list; reviewer assesses adequacy.
- Operational deadline queue: Compute overdue items from entered dates and completed flags; no external notifications.

## Workspace features

Role-based login and account management; validated create/edit/delete; required parent and sibling relationships; search and pagination; atomic JSON imports; CSV/JSON exports; optimistic concurrency; two independent human reviews; immutable source-text uploads with independent review; dated task calendar; aggregate reports; searchable audit trail; model catalog and administrator AI settings; configured HTTPS connectors with approval, idempotency and receipt checks.

## Integration boundaries

A finite working scope, not every conceivable feature. No production regulator, insurer, carrier, court, university or clinical integration is preconfigured. Source uploads support text/CSV/JSON/Markdown, not OCR/PDF parsing. AI produces drafts and cannot authorize clinical handling, adjudicate rights, select recipients or jurors, establish eligibility, certify regulatory compliance or send submissions. Live external execution requires a configured adapter and independent human approval of the current record. Calculations use supplied rules and units; example rules are fictional.
