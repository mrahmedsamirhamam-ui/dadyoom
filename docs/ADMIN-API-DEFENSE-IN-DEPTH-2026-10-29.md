# Dadyoom handler-local admin authorization — 2026-10-29

## Threat addressed
`proxy.ts` protects `/api/admin/**` and `/api/teacher/**` through Next.js Node proxy logic. Cloudflare/OpenNext documents Node middleware as not yet supported, so proxy-only authorization is not safe to assume on Workers.

## Implementation
- Each exported HTTP handler in all 19 `app/api/admin/**/route.ts` files calls `requireAdminResponse()` before body parsing, database access, external APIs or mutation.
- Helper checks the verified `supabase.auth.getUser()` session and the actual role in `public.profiles`; returns HTTP 401/403 on failures. Exceptions fail closed with HTTP 401; unauthorized responses have `Cache-Control: no-store`.
- Existing in-handler checks, `proxy.ts` and RLS remain additional defenses.
- All 19 route files are checked by CI. Two teacher routes also have local role checks; no teacher logic was changed.

## Remaining release gate
Run Cloudflare workerd runtime tests with no session (401/403), real authorized test admin, unauthorized teacher/student, and server-side grading before production. Review Cloudflare issue #46 and PR #78. Never interpret unit tests as proof that production Cloudflare deployment succeeded.
