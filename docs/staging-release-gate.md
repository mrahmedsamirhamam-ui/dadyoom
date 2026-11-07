# Dadyoom staging release gate

Status: READY FOR QA / NOT READY FOR MERGE. This is a release policy, **not** evidence that staging is provisioned, deployed, or tested.

## Environments
- Production: https://dadyoom.com — protected; no direct QA mutations.
- Intended staging hostname: https://staging.dadyoom.com — **unverified** until DNS, TLS, deployment, and authenticated smoke tests pass.
- Staging must use separate test accounts, isolated data and credentials; never reuse production service-role keys or real student records.
- Restrict staging indexing (noindex and access controls); no public test-account secrets.

## Mandatory verification (record command, commit SHA, timestamp, exit code, evidence)
1. `npm ci`
2. `npm run lint`
3. `npx tsc --noEmit`
4. `npm run test:run` (the package's `npm test` runs watch-mode Vitest; do not use it as an unattended CI gate)
5. `npm run build`
6. Browser smoke: homepage, login, logout, role-specific dashboards, lessons, AI actions and games where implemented. Record actual behavior, not placeholders.
7. Auth/RBAC: missing, invalid and expired JWT => 401; authenticated unauthorized role and cross-user access => 403 or consistent non-disclosing 404; own linked records only; attempt role escalation via profile update must fail.
8. Data integrity: verify foreign keys, unique/check constraints, tenant and relationship RLS, soft-deleted/disabled relationship isolation, migrations on disposable staging database, backup/restore and rollback rehearsal.
9. Curriculum: compare actual lessons against official source, country/grade/term; do not infer completeness from published counts.
10. Performance, mobile RTL/LTR, accessibility, error and privacy checks. Log any exceptions and owners.

## Deployment guard
- PR #138 stays draft/unmerged until all applicable gates have independently recorded PASS and no critical/high findings remain.
- Never auto-promote staging to production solely from a green build.
- Require explicit production approval, tested rollback procedure, and production configuration review.
- If staging DNS/TLS/hosting or isolated database are missing, mark **STAGING NOT READY**, do not claim deployment.
- Do not run destructive migrations or modify production data as part of staging setup.

## Evidence checklist
| Gate | Status | Evidence |
| --- | --- | --- |
| DNS + TLS + staging deployment | NOT VERIFIED | |
| Separate secrets and test data | NOT VERIFIED | |
| Install / lint / typecheck / unit tests / build | NOT VERIFIED | |
| Auth / RBAC / IDOR / JWT | NOT VERIFIED | |
| FK / migrations / rollback / soft delete | NOT VERIFIED | |
| Browser smoke / mobile / language direction | NOT VERIFIED | |
| Production promotion approval | BLOCKED | |

Update these rows only with actual evidence. No production merge/deploy is authorized by this document.
