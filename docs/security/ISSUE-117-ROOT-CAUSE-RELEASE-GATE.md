# DADYOOM P0 #117 — Root cause, containment and release gate
**Status:** engineering review, not production remediation. **Repo:** dadyoom only.
**Captured:** 2026-11-06. Evidence: read-only pg_policies on production Supabase,
draft PR #116/#118 and code inspection. Do not write identifiable user rows to logs.

## 1. Root cause
**Unauthorized role = data integrity defect, not CSS or session navigation defect.**
- public.profiles UPDATE allows owners to set role to an allowed user role;
  prior BEFORE UPDATE trigger stops admin but not teacher/school.
- INSERT accepts teacher/school from an authenticated user's own client.
- public.handle_new_user() consumes user-controlled raw_user_meta_data.role.
- main's /api/auth/complete-profile and OAuth callback use privileged upsert
  from an untrusted desired-role value, bypassing RLS.
- Existing teacher_classes INSERT accepts teacher_id=auth.uid() without a
  verified teacher requirement. Marketplace ownership writes use a similar
  condition. Even a correct app guard does not protect direct PostgREST calls.

## 2. Verified implementation in this REVIEW branch
- Registrations to teacher/school create student-scoped profile and pending
  profile_role_requests, never grant teacher/school privilege automatically.
- Server guard hasVerifiedPrivilegedRole checks stored profile role against an
  APPROVED role request with reviewed_by/reviewed_at. Missing table/row,
  mismatched role, denied RLS, malformed approval => fail closed.
- authorizeSession, teacher AI generation and teacher media writes call the
  guard before any trusted operation. Portal server rendering also checks it.
- Review-only SQL blocks role mutation/privileged INSERT at DB level.
- Additional review-only RESTRICTIVE policies intersect with existing
  ownership constraints for direct teacher writes to seven teacher resources;
  they do not grant new authority.
- CI executes functional mocks and disposable PostgreSQL tests; these are
  engineering evidence, not evidence of a successful production migration.

## 3. Known limits / stop-ship
- **No production migration applied**, and the dangerous role UPDATE/INSERT
  permissions remain until independently authorized and verified.
- Not every protected school/teacher RPC, Storage policy or Server Action has
  been audited. Full Data API and SECURITY DEFINER audit is mandatory.
- Existing privileged profiles without an approved request are denied by the
  new guard. DO NOT backfill them as approved without a verified, recorded
  decision by a trusted administrator. Their count and status must be audited
  privately and reconciled before rollout.
- Approvals are not yet an implemented admin workflow; no public approve RPC.
- As with any system, a 100% guarantee from only unit/CI tests is impossible.

## 4. Isolated acceptance criteria
1. Snapshot schemas, grants, functions, RLS and triggers; test a backup restore
   using entirely synthetic identities. Record hash, version and rollback plan.
2. Apply BOTH review-only proposals inside a fresh, disposable Postgres 16
   instance or a safely cloned Supabase project, never the live database.
3. Test actual RLS JWTs as student, child, parent, pending teacher/school,
   verified teacher/school, revoked teacher/school and admin. Verify:
   - Direct UPDATE cannot change role, id, email; own name still editable.
   - Direct INSERT cannot create teacher, school or admin role.
   - User-editable signup/OAuth role requests never become privileges.
   - Teacher classes, assignments and marketplace writes fail without an
     approved teacher, including existing student-created resource IDs.
   - Other tenants' student/parent/school records remain inaccessible.
   - Approved workflows still work; revoked permissions fail immediately.
   - All server-side routes, actions, RPCs, Storage policies and edge paths
     are separately audited. Do not rely on UI or proxy/middleware alone.
4. Full login, OAuth, password reset and profile-completion smoke tests.
   Measure extra approval lookup latency; it is indexed by user_id PK.
5. Rerun complete TypeScript, lint, build, Chrome mobile journey and Cloudflare
   Workerd deploy smoke. Validate at exact release SHA.
6. Require signed review of existing privileged accounts and an explicit
   owner-approved cutover. Keep main/production unchanged until all pass.

## 5. Rollback without reopening the vulnerability
- If a privileged service breaks, disable that service's write operations
  and revert the application deployment to a last-known-safe restricted
  version; never reopen unverified teacher/school grants.
- For database changes use a rehearsed rollback based on saved definitions,
  **but do not restore the vulnerable self-promotion RLS policies/triggers**.
  Retain DENY for role mutation and privileged writes until a reviewed safe
  replacement is available.
- Restore data only from a proven backup, preserving historical accounts
  and student activity. Record incident, hashes and operator approval.

## 6. Prevention rules
- A principal cannot grant its own privileged role. Role approval requires
  an independently authenticated, audited administrative authority.
- Ownership != professional role approval. SQL and server routes enforce both.
- Never use user_metadata/raw_user_meta_data as authority.
- Add deny/allow/revoke scenarios to CI and real JWT staging integration.
- Every new teacher/school API, action or RLS policy must pass an explicit
  authorization checklist in PR review.
- Security gate for deployment: **ZERO open P0 and a validated Cloudflare
  runtime**, not merely green CI.
