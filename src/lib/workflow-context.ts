import { createHash } from 'node:crypto';
import { canonicalEvidence, loadEvidence } from './ai-evidence';
import { objectBody, RequestError } from './record-policy';

export async function workflowContext(db: unknown, body: Record<string, unknown>, input: Record<string, string>, workflow: string, actorId: string, allowEmpty = false) {
  const scope = body.scope === undefined ? {} : objectBody(body.scope);
  if (scope.id !== undefined && typeof scope.id !== 'string') throw new RequestError('Invalid subject identifier');
  if (typeof scope.id === 'string' && scope.id.trim()) return loadEvidence(db, scope, body.evidence);
  for (const name of ['evidence', 'artifactIds']) {
    if (body[name] !== undefined && (!Array.isArray(body[name]) || (body[name] as unknown[]).length)) throw new RequestError('Select a subject record before adding saved evidence or documents');
  }
  if (!allowEmpty && !Object.values(input).some(value => value.trim())) throw new RequestError('Enter workflow details or fill an example before generating a draft');
  const snapshot = { workflow, actorId, enteredFields: input, capturedAt: new Date().toISOString(), sourceType: 'user-entered-inputs', verified: false };
  const id = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  const rows = [{ entity: 'WorkflowInput', record: { id, ...snapshot } }];
  return { rows, scope: { entity: 'WorkflowInput', id }, ...canonicalEvidence(rows) };
}
