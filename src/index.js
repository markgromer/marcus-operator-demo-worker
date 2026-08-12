const json = (body, init = {}) => new Response(JSON.stringify(body, null, 2), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...(init.headers || {}),
  },
});

function auditProject(input = {}, env = {}) {
  const project = String(input.project || env.DEMO_PROJECT || 'Demo Project').trim();
  const request = String(input.request || 'Audit the project and prepare Codex.').trim();
  const signals = [
    'Project was resolved from the conversation.',
    'Cloudflare Worker runtime is reachable.',
    'Codex prompt includes objective, constraints, and verification.',
    'External actions remain approval-gated.',
  ];
  return {
    project,
    request,
    status: 'audited',
    signals,
    risk: request.match(/\bdeploy|dns|publish|email|text|send\b/i) ? 'approval-required' : 'low',
  };
}

function composeCodexPrompt(audit) {
  return [
    '# Goal for Codex',
    '',
    '## Objective',
    audit.request,
    '',
    '## Project',
    `- Name: ${audit.project}`,
    '- Runtime: Cloudflare Worker demo',
    '',
    '## Marcus Audit',
    ...audit.signals.map((signal) => `- ${signal}`),
    '',
    '## Rules',
    '- Inspect before changing code.',
    '- Keep the change scoped.',
    '- Do not deploy, publish, email, text, merge, or change DNS without approval.',
    '- Verify the result before claiming completion.',
    '',
    '## Verification',
    '- Run project tests.',
    '- Confirm the Worker responds on /health and /demo.',
  ].join('\n');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/demo') {
      return json({
        ok: true,
        name: 'Marcus Operator Demo',
        message: 'Marcus can audit a project, write a Codex prompt, and track approval-gated execution.',
        endpoints: ['/health', '/audit', '/codex/start'],
      });
    }
    if (url.pathname === '/health') {
      return json({ ok: true, service: 'marcus-operator-demo-worker', time: new Date().toISOString() });
    }
    if (url.pathname === '/audit' && request.method === 'POST') {
      const input = await request.json().catch(() => ({}));
      const audit = auditProject(input, env);
      return json({ ok: true, audit, codexPrompt: composeCodexPrompt(audit) });
    }
    if (url.pathname === '/codex/start' && request.method === 'POST') {
      const input = await request.json().catch(() => ({}));
      const audit = auditProject(input, env);
      const codexPrompt = composeCodexPrompt(audit);
      return json({
        ok: true,
        mode: env.DEMO_MODE || 'codex-handoff',
        session: {
          id: `demo_codex_${crypto.randomUUID()}`,
          status: 'handoff_ready',
          approvalRequiredForExternalActions: true,
        },
        audit,
        codexPrompt,
      }, { status: 201 });
    }
    return json({ ok: false, error: 'Not found' }, { status: 404 });
  },
};

export { auditProject, composeCodexPrompt };

