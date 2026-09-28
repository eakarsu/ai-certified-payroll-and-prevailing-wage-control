/**
 * Launch-condition validation: "Authoritative rules and accepted packet
 * verification" (TOP20.md rank 12).
 *
 * Pins two properties:
 *   1. wage determinations cannot be produced without naming the rule source
 *      they were computed against, and the arithmetic is correct
 *   2. a packet is only "verified" for presence + validity window — the engine
 *      never claims it has judged adequacy
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/lib/domain-engine';
import tools from '../src/config/domain-tools.json';
import { toolResponseResult } from '../src/app/api/tools/route';

const RULE = 'DOL WD 2026-04 (29 CFR Part 5)';

/* -------------------- 1. authoritative wage rules -------------------- */

test('payroll: refuses to compute without a reviewed rule source', () => {
  assert.throws(
    () =>
      calculate('payroll', {
        regularMinutes: 480,
        overtimeMinutes: 0,
        baseRateCents: 2500,
        fringeRateCents: 450,
        overtimeMultiplier: 1.5,
        grossPaidCents: 20000,
        fringePaidCents: 3600,
      }),
    /rule source/i,
  );
});

test('payroll: wage and fringe are separate obligations; OT multiplies base only', () => {
  // 8h @ $25.00 base, 2h OT @ 1.5x, fringe $4.50 on all 10h.
  const r: any = calculate('payroll', {
    ruleSource: RULE,
    regularMinutes: 480,
    overtimeMinutes: 120,
    baseRateCents: 2500,
    fringeRateCents: 450,
    overtimeMultiplier: 1.5,
    grossPaidCents: 0,
    fringePaidCents: 0,
  });

  // base: 480*2500*1000 + 120*2500*1500, divided by 60000 → 240000 cents = $2400
  assert.equal(r.requiredWageCents, 27500);
  // fringe: (480+120)*450 / 60 = 4500 cents = $45.00 (paid on ALL hours, incl OT)
  assert.equal(r.requiredFringeCents, 4500);
  assert.equal(r.wageShortfallCents, 27500);
  assert.match(r.method, /overtime multiplier applies only to base wages/i);
});

test('payroll: shortfall is zero when the worker was paid enough', () => {
  const r: any = calculate('payroll', {
    ruleSource: RULE,
    regularMinutes: 480,
    overtimeMinutes: 0,
    baseRateCents: 2500,
    fringeRateCents: 450,
    overtimeMultiplier: 1.5,
    grossPaidCents: 20000,
    fringePaidCents: 3600,
  });
  assert.equal(r.requiredWageCents, 20000);
  assert.equal(r.requiredFringeCents, 3600);
  assert.equal(r.wageShortfallCents, 0);
  assert.equal(r.fringeShortfallCents, 0);
});

test('payroll: overtime multiplier is capped at three decimals', () => {
  assert.throws(
    () =>
      calculate('payroll', {
        ruleSource: RULE,
        regularMinutes: 60,
        overtimeMinutes: 0,
        baseRateCents: 1000,
        fringeRateCents: 0,
        overtimeMultiplier: '1.5555',
        grossPaidCents: 0,
        fringePaidCents: 0,
      }),
    /three decimals/,
  );
});

test('payroll: a fractional hour without minutes precision is rejected', () => {
  assert.throws(
    () =>
      calculate('payroll', {
        ruleSource: RULE,
        regularMinutes: 480.5,
        overtimeMinutes: 0,
        baseRateCents: 1000,
        fringeRateCents: 0,
        overtimeMultiplier: 1.5,
        grossPaidCents: 0,
        fringePaidCents: 0,
      }),
    /integer/,
  );
});

/* -------------------- 2. accepted packet verification --------------- */

test('packet: evidence check reports presence only, never adequacy', () => {
  const r: any = calculate('evidence', {
    requirements: [
      { id: 'fringe', requirement: 'Fringe benefit statements', evidence: 'attached: fringes-q3.pdf' },
      { id: 'wage', requirement: 'Payroll registers', evidence: '' },
    ],
  });
  assert.equal(r.checks[0].present, true);
  assert.equal(r.checks[1].present, false);
  assert.match(r.scope, /Presence only/i);
  assert.match(r.scope, /review source quality/i);
});

test('packet: a document outside its validity window does not cover the event', () => {
  const r: any = calculate('windows', {
    ruleSource: RULE,
    eventAt: '2026-07-15',
    documents: [
      { id: 'determination', validFrom: '2026-01-01', validUntil: '2026-12-31' },
      { id: 'expired', validFrom: '2025-01-01', validUntil: '2025-12-31' },
    ],
  });
  assert.equal(r.checks[0].coversEvent, true);
  assert.equal(r.checks[1].coversEvent, false);
});

test('packet: a validity window that ends before it starts is rejected', () => {
  assert.throws(
    () =>
      calculate('windows', {
        ruleSource: RULE,
        eventAt: '2026-07-15',
        documents: [{ id: 'bad', validFrom: '2026-06-01', validUntil: '2026-01-01' }],
      }),
    /end precedes start/,
  );
});

test('packet: duplicate identifiers are rejected rather than silently merged', () => {
  assert.throws(
    () =>
      calculate('evidence', {
        requirements: [
          { id: 'a', requirement: 'One', evidence: 'x' },
          { id: 'a', requirement: 'Two', evidence: 'y' },
        ],
      }),
    /Duplicate identifier/,
  );
});

test('packet: the shipped tools API reports rule-source provenance', () => {
  const tool = tools.find(t => t.id === 'domain-calculation');
  assert.ok(tool, 'the payroll calculation tool is shipped');
  const input = {
    ruleSource: RULE,
    regularMinutes: 60,
    overtimeMinutes: 60,
    baseRateCents: 1000,
    fringeRateCents: 0,
    overtimeMultiplier: 1.5,
    grossPaidCents: 0,
    fringePaidCents: 0,
  };
  // toolResponseResult is the exact payload builder used by POST /api/tools.
  const verified: any = toolResponseResult(tool, input, false, { id: 'fixture-rule-version' });
  assert.equal(verified.ruleSource, RULE);
  assert.equal(verified.ruleSourceStatus, 'VERIFIED');
  assert.equal(verified.ruleVersionId, 'fixture-rule-version');
  assert.equal(verified.datasetType, 'user-supplied');
  assert.equal(verified.requiredWageCents, 2500);
  const example: any = toolResponseResult(tool, { ...input, ruleSource: 'example-only' }, true, null);
  assert.equal(example.ruleSourceStatus, 'UNVERIFIED');
  assert.equal(example.ruleVersionId, null);
  assert.equal(example.datasetType, 'example');
});

test('packet: accepted packet window verification is reachable from the shipped catalog', () => {
  const tool = tools.find(t => t.operation === 'windows');
  assert.ok(tool, 'the validity-window tool is shipped in the tools catalog');
  const r: any = toolResponseResult(tool, tool.example, true, null);
  assert.equal(r.checks[0].coversEvent, true);
  assert.equal(r.checks[1].coversEvent, false);
});
