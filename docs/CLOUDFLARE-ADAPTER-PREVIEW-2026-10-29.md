# Dadyoom Cloudflare Workers deployment rescue — staging only

**Purpose:** Create a verifiable OpenNext/Next.js 16 Worker bundle without altering the working production instance, secrets, DNS, payment setup or Supabase.

## Verified starting conditions
- The GitHub Next.js/TypeScript/ESLint build is green, while Cloudflare "Workers Builds: dadyoom" checks repeatedly fail on main and previews.
- At the start of this work, this repo contained no Wrangler/OpenNext config, no Worker artifact and no `@opennextjs/cloudflare` or `wrangler` dependencies.
- **Exact first Cloudflare failure line is not available via the GitHub check summary.** Cloudflare dashboard is required for that line. No claim about the definitive root cause is made.
- Source of latest failing check: https://github.com/mrahmedsamirhamam-ui/dadyoom/commit/59d0a92898bb28ac6ffbc6de6ce18dc8107c8031
- Cloudflare Build settings are external to this repo and must be verified under Cloudflare Workers > dadyoom > Settings > Build.

## Preview and safety
- Preview branch only: `fix/cloudflare-opennext-preview-20261029`.
- Preview Worker is named `dadyoom-adapter-preview`. **This config is intentionally not pointed at live `dadyoom` and has no production route/custom domain.**
- CI installs and pins `@opennextjs/cloudflare@1.20.13` and `wrangler@4.154.0`, regenerates `package-lock.json` and only commits both files if `opennextjs-cloudflare build` and `wrangler deploy --dry-run` succeed. **CI never runs deploy/upload.**
- Run the GitHub Actions job "Dadyoom Cloudflare adapter preview (no deployment)" from its push. Observe the first failing step, not only job status.
- Current Cloudflare Worker size limit: **64 MiB uncompressed on both Free and Paid plans** (September 4, 2026 change). The old 3 MiB Free / 10 MiB Paid compressed limit **no longer applies**. Gate on Wrangler's *Total Upload*, not gzip. Runtime CPU, memory, startup and per-request limits remain separate. Source: https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/
- Important runtime checks after generating a worker: /, /about, /founder, /login, role-bound /admin, /lessons/{id}, Supabase Auth login/callback, server-only answer key access and graded submission, private-tenant RLS, non-public secrets, and assets. Never run writes against the live student database as a smoke test.
- On verified success: compare Cloudflare live build/deploy command, root, branch, bindings, and secrets **names only**; change production settings and deployment only with confirmed safe configuration/preview and rollback. Do not point `wrangler.jsonc` to `dadyoom` until ready.

## Required Cloudflare build settings (for OpenNext, only after validated)
1. Build command: `npm ci && npx opennextjs-cloudflare build`
2. Deploy command: `npx opennextjs-cloudflare deploy`
3. Preview branch: use isolated preview/upload only after validating the version flow; do not reuse production custom domain.
4. For this branch, Node 22 compatibility and the `nodejs_compat` Worker flag are required.
5. Secret values remain outside GitHub; confirm runtime bindings separately from build-time variables.

## References
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://opennext.js.org/cloudflare/
- Issue #46: https://github.com/mrahmedsamirhamam-ui/dadyoom/issues/46

**Acceptance:** first successful real Cloudflare preview deployment, no Free plan overage and verified 64 MiB uncompressed size limit, verified SSR/Auth/lesson/game functionality and rollback, then published live version. This document does not claim those outcomes have occurred.

## First real adapter build — 2026-10-29
- GitHub run: https://github.com/mrahmedsamirhamam-ui/dadyoom/actions/runs/40830068925
- `npm ci` passed, pinned OpenNext/Wrangler installation passed, second reproducible `npm ci` passed, OpenNext Worker build passed, and `wrangler deploy --dry-run` passed.
- Wrangler output: **Total Upload 18,408.05 KiB uncompressed / 3,521.54 KiB gzip**.
- Original workflow concluded failure only because its **obsolete 3 MiB compressed Free-tier size gate** rejected the bundle. This was not a Cloudflare API deployment failure and is corrected by a follow-up commit.
- OpenNext warns: **Node.js middleware support is experimental and not officially maintained by OpenNext**. This project has a server-side `proxy.ts` privilege guard for admin/teacher API routes; this makes authenticated preview/runtime tests mandatory before promoting a Worker. Never switch production to an untested adapter.
- The true reason the independent Cloudflare dashboard build fails is not yet exposed by the GitHub status; examine the external log in Cloudflare.
