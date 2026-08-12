# Operator Controls

## Exact project binding

- Project: `Marcus Operator Demo` (personal)
- GitHub repository: `markgromer/marcus-operator-demo-worker`; default branch: `master`
- Cloudflare Worker: `marcus-operator-demo-worker`
- Production URL: `https://marcus-operator-demo-worker.markgromer.workers.dev/`
- Runtime entry point: `src/index.js`; binding source: `wrangler.jsonc`

Treat those identifiers as immutable targets for an operation. Never infer or substitute an account, repository, branch, Worker, route, or URL. A mismatch stops the operation and requires a new audited handoff.

## Approval boundary

Read-only audit and local edits or checks on an operation branch are allowed. Each push, pull-request mutation, merge, deploy or publish, DNS or route change, credential or secret change, and external message requires its own recorded M.A.R.C.U.S. approval naming the exact action and target. Approval for one action does not authorize another; absence, ambiguity, or stale approval means stop. Never print or persist credentials.

## Drift checks

Immediately before an approved mutation, re-read the repository identity, current branch and HEAD, clean/expected worktree diff, `wrangler.jsonc` Worker name and entry point, intended Cloudflare account/Worker/route, and the recorded approval. Compare them with this binding and the audited handoff. Stop on unexpected commits, files, configuration, provider state, or target changes; re-audit and obtain renewed action-specific approval.

## Verification and authoritative read-back

Before handoff, review the complete diff and run the repository's available test and dry-run build commands. After any separately approved external mutation, read the result back from the authoritative provider rather than trusting command success: GitHub for branch/commit/PR/merge state, Cloudflare API or dashboard for Worker version/config/routes, DNS provider for DNS, secret provider metadata for secrets, and the messaging provider for delivery. Record target, provider identifier or revision, timestamp, observed state, and verification result. A public endpoint may supplement but never replace provider read-back. Do not claim completion when read-back is missing or differs from the approved target.
