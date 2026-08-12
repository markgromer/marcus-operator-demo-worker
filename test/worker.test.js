import assert from 'node:assert/strict';
import test from 'node:test';

import worker, { DEMO_VERSION, auditProject, composeCodexPrompt } from '../src/index.js';

test('exports the demo version', () => {
  assert.equal(DEMO_VERSION, '0.1.0');
});

test('GET /version returns the service version', async () => {
  const response = await worker.fetch(new Request('https://example.com/version'), {});

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'marcus-operator-demo-worker',
    version: DEMO_VERSION,
  });

  const postResponse = await worker.fetch(new Request('https://example.com/version', { method: 'POST' }), {});
  assert.equal(postResponse.status, 404);
});

test('auditProject marks risky external actions as approval-gated', () => {
  const audit = auditProject({ project: 'Royal Doody', request: 'Deploy and text the client' });
  assert.equal(audit.project, 'Royal Doody');
  assert.equal(audit.risk, 'approval-required');
});

test('composeCodexPrompt includes approval boundaries and verification', () => {
  const prompt = composeCodexPrompt(auditProject({ request: 'Fix mobile booking' }));
  assert.match(prompt, /Do not deploy/);
  assert.match(prompt, /Verify the result/);
});

test('worker exposes health, readiness, and simulated Codex start endpoints', async () => {
  const health = await worker.fetch(new Request('https://example.com/health'), { DEMO_PROJECT: 'Demo' });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const readiness = await worker.fetch(new Request('https://example.com/readiness'), { DEMO_MODE: 'codex-handoff' });
  const readinessBody = await readiness.json();
  assert.equal(readiness.status, 200);
  assert.equal(readinessBody.status, 'ready');
  assert.equal(readinessBody.checks.externalActionsApprovalGated, true);

  const start = await worker.fetch(new Request('https://example.com/codex/start', {
    method: 'POST',
    body: JSON.stringify({ project: 'Demo', request: 'Audit and prepare Codex' }),
  }), { DEMO_PROJECT: 'Demo', DEMO_MODE: 'codex-handoff' });
  const body = await start.json();
  assert.equal(start.status, 201);
  assert.equal(body.session.status, 'handoff_ready');
  assert.match(body.codexPrompt, /Goal for Codex/);
});
