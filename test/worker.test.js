import assert from 'node:assert/strict';
import test from 'node:test';

import worker, { auditProject, composeCodexPrompt } from '../src/index.js';

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

test('worker exposes health and simulated Codex start endpoints', async () => {
  const health = await worker.fetch(new Request('https://example.com/health'), { DEMO_PROJECT: 'Demo' });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const start = await worker.fetch(new Request('https://example.com/codex/start', {
    method: 'POST',
    body: JSON.stringify({ project: 'Demo', request: 'Audit and prepare Codex' }),
  }), { DEMO_PROJECT: 'Demo', DEMO_MODE: 'codex-handoff' });
  const body = await start.json();
  assert.equal(start.status, 201);
  assert.equal(body.session.status, 'handoff_ready');
  assert.match(body.codexPrompt, /Goal for Codex/);
});

test('GET /readiness reports project and operation readiness checks', async () => {
  const response = await worker.fetch(new Request('https://example.com/readiness'), {
    DEMO_PROJECT: 'Marcus Operator Demo',
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    ok: true,
    project: 'Marcus Operator Demo',
    status: 'ready',
    checks: {
      github: true,
      cloudflareWorker: true,
      durableOperation: true,
      approvalGate: true,
      verification: true,
    },
  });
});

test('root endpoint advertises readiness without removing existing endpoints', async () => {
  const response = await worker.fetch(new Request('https://example.com/'), {});
  const body = await response.json();

  assert.deepEqual(body.endpoints, ['/health', '/readiness', '/audit', '/codex/start']);
});
