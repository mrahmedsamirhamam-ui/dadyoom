# Dadyoom — zero-cost local staging (Windows 11)

**NO-GO: Never point these commands at production.** No production dump, secrets, or real student data. This setup uses Docker locally and does not create a billable Supabase project.

## Prerequisites
- Docker Desktop with WSL2 backend (Docker must be running).
- Node.js 20+ and npm; Git.
- Free disk space for local Supabase images. Docker Desktop licensing must be checked for your organization.

## Setup (PowerShell, in an isolated checkout of PR #155)
```powershell
git clone https://github.com/mrahmedsamirhamam-ui/dadyoom.git dadyoom-staging-local
cd dadyoom-staging-local
git checkout security/p0-profile-role-lock-20261116
docker info
npx --yes supabase@latest --version
npx --yes supabase@latest init
npx --yes supabase@latest start
npx --yes supabase@latest status
```

**Important:** `supabase init` may report that `supabase/config.toml` already exists; do not overwrite it. If the checkout already has `supabase/config.toml`, skip init. `supabase start` provides a LOCAL Supabase stack, not a copy of the production database.

## Safety gates before applying any SQL
1. Confirm the database URL is localhost/127.0.0.1, and the project ref is NOT production `hvqsvtomhlxavmfqoxfz` or the school project `wqldqqqzvvtfhpjuiwuc`.
2. Build the schema from reviewed migrations, not from real production user records. Check actual column names and RLS policies before executing `security/staging/permissions-hardening.sql`: it is a **review draft** and assumes columns such as `question_order` that may not exist.
3. Reconcile the RPC and all callers before revoking table-level grants. The current SQL intentionally blocks legacy direct writes.
4. Seed two synthetic users and lesson/assessment rows; do not paste credentials into commits.
5. Do not link the CLI to the production project or run `db push`, `db reset --linked`, `db dump --linked`, or deploy commands.

## Verification sequence
- Run static SQL schema/grant checks against LOCAL database.
- Apply reviewed local-only schema changes using LOCAL SQL editor/psql, **never the linked project**.
- Start app locally with local Supabase keys only.
- Use `security/staging/verify-assessment.mjs` with local JWTs; its original host guard currently only accepts *.supabase.co, so it needs a deliberate localhost-only adaptation before running against local stack.
- Reward outbox is not student-readable by design; verify award count via a privileged LOCAL SQL assertion instead of student JWT.
- Run `npm ci`, `npm run build`, and repository-specific typecheck/lint scripts if present.
- Record actual outputs; do not mark tests passed until executed.

## Current status
No Docker or Supabase CLI executable is available in the assistant's execution container. No local PostgREST integration tests were run in this session. Supabase cloud staging project creation was rejected because the free active-project limit is already reached. **NO-GO stays.**
