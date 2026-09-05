import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workflowContext } from '../src/lib/workflow-context';

test('input-only context preserves complete user text and labels it unverified', async () => {
  const input = { objective: 'Compare source evidence', optionalNotes: 'x'.repeat(500) + 'important ending' };
  const result = await workflowContext({}, {}, input, 'fixture', 'actor');
  assert.equal(result.scope.entity, 'WorkflowInput');
  assert.equal(result.rows[0].record.verified, false);
  assert(result.text.includes('important ending'));
  assert(!result.text.includes('approved'));
});
test('input-only drafts reject absent inputs and detached saved evidence', async () => {
  await assert.rejects(workflowContext({}, {}, {}, 'fixture', 'actor'), /Enter workflow details/);
  await assert.rejects(workflowContext({}, {evidence:[{entity:'Other',id:'other'}]}, {objective:'Draft'}, 'fixture', 'actor'), /Select a subject/);
  await assert.rejects(workflowContext({}, {artifactIds:['other']}, {objective:'Draft'}, 'fixture', 'actor'), /Select a subject/);
});
test('field planning can start from an empty form without inventing domain records', async () => {
  const result = await workflowContext({}, {scope:{entity:'Unused',id:''}}, {}, 'fixture', 'actor', true);
  assert.equal(result.scope.entity, 'WorkflowInput');
  assert.deepEqual(result.rows[0].record.enteredFields, {});
});
