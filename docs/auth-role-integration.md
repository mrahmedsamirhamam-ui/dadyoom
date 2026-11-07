# Dadyoom authentication and role integration

The current platform is Next.js + Supabase Auth, **not NestJS**. The submitted
NestJS snippets (AuthModule, LoginDto, login, JwtAuthGuard, RolesGuard) describe
intent, not a second authentication service to install.

## Current implementation in this branch

- `lib/auth/roles.ts` defines the six requested roles and a strict role matcher.
- `lib/auth/require-role.ts` provides a server-only, fail-closed helper using
  `supabase.auth.getUser()` and the authenticated profile under RLS.
- `tests/security/role-contract.test.ts` tests role normalization and denial.
- No JWT secret, password hash, custom token issuer, or parallel user table.

## Before integration into live routes

1. Inspect production `profiles` schema, `is_active` availability, RLS and all
   existing role values. The helper intentionally fails closed if the schema
   differs; do not deploy a caller until this is confirmed.
2. Migrate historical role names explicitly (especially `admin`), after
   enumerating affected accounts, policies, and UI consumers.
3. Validate `school_id`, `ministry_id`, and country scope server-side in each
   resource query. A role alone never grants cross-tenant access.
4. Keep login on Supabase Auth. Never trust user metadata or client-supplied roles
   for authorization; prevent self-promotion via RLS and privileged writes.
5. Run typecheck, lint, tests, build and browser smoke checks before merge.
6. Treat the earlier Flutter screen snippets as separate mobile-app prototypes;
   they are not Next.js production components.

This branch does not alter production DB or deploy to the website.
