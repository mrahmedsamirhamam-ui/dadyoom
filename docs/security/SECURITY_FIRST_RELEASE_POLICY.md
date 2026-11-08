# Security First — Mandatory Release Gates

Status: **proposed policy**, not an active CI enforcement rule. Default release decision: NO-GO if any critical/high security issue is open, any mandatory security check fails/is missing, or a restore test is unverified.

## Required authorization matrix
- Student cannot self-promote to Teacher or access another student's data.
- Teacher cannot self-promote to School Admin or modify grades without authorized server grading/review workflow.
- School Admin cannot self-promote to Super Admin or access another school.
- Parent can access only explicitly linked children; revocation must take effect.
- Network Admin and Ministry Admin have explicit scope-limited aggregation, not automatic raw student access.
- Super Admin access is audited and least-privileged.

## Negative security tests
1. Anonymous, missing/invalid/expired token: deny protected endpoints.
2. Client-supplied role, tenant_id, student_id, is_correct, score, answer_key: never accepted as authority.
3. IDOR: deny foreign learner, class, school, assessment, report, file, and parent-child resources.
4. RLS: direct database access attempts across tenants and unauthorized writes must fail; test both positive and negative policies.
5. SQL/injection, XSS, CSRF as applicable, malicious uploads, rate limits, and broken access control.
6. Answer keys and question banks: server-only protected access; avoid including in student payloads.
7. Grade integrity: immutable provenance, authorized correction path, audit event for every change.
8. Secrets: no secret keys in browser bundles, logs, or repository.
9. Audit logs: role changes, grade changes, deletion, transfers, user creation; tamper resistance, access controls, retention.
10. Backup: daily and weekly schedule evidence, encrypted access-controlled backups, periodic isolated restore with measured RPO/RTO.
11. Monitoring: daily scan of auth anomalies, failed access, app errors and high-severity vulnerabilities; escalation owner and evidence.

## Security Readiness Score (design proposal only)
Identity/roles 25; tenant/learner isolation 25; grade/data integrity 20; API/application 15; backup/restore 10; audit/monitoring 5. Each section requires linked evidence; untested sections are 'unknown', not passed. A high total score NEVER overrides a critical/high issue or failed gate.

## Release approval
Record: commit SHA, threat model, test run links, staging URL, RLS matrix results, backup restore proof, data protection signoff, performance checks, owner approval, gradual rollout/rollback and post-release monitoring. No automated merge or deployment authorized by this document.

## Known blockers to investigate (not assumed resolved)
- Issue #117: role escalation/RLS
- Issue #57: answer keys/grade integrity
- Issue #46: Cloudflare build
Review current state before acting; issue references alone do not prove exploitability.
