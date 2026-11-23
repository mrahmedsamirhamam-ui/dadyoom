# Staging security verification — 2026-11-16 — NO-GO

## Environment discovery
Connected Supabase account lists only:
- dadyoom: production, DO NOT MODIFY.
- Mumawwil: separate production project, DO NOT USE.
No verified isolated Dadyoom staging project exists in the connected account.

## Deliverables committed to PR #155
- `security/staging/permissions-hardening.sql`: staging-only FORCE RLS on the **actual** four tables (questions, ai_assessments, assessment_session_answers, assessment_sessions), revoke broad table grants, explicitly grant safe SELECT columns, security_invoker view. NOT APPLIED.
- `security/staging/verify-assessment.mjs`: PostgREST student JWT checks, direct write attempt, 10 concurrent RPC requests and answer/reward count checks. NOT EXECUTED.
- `security/review-only/atomic-assessment-draft.sql`: atomic grading draft. NOT APPLIED.

## Observed vs not verified
| Gate | Status | Evidence |
|---|---|---|
| Production catalog inspection | PASS (read-only) | RLS enabled, FORCE disabled; authenticated table-level SELECT/UPDATE/DELETE grants observed |
| Secret-column direct student access | NOT RUN | Requires staging student JWT and migrated grants |
| Cross-student isolation | NOT RUN | Requires synthetic users |
| Direct grade tampering | NOT RUN | Requires staging |
| 10 parallel grading requests | NOT RUN | Requires installed RPC and staging seed |
| Exactly one reward | NOT RUN | Outbox intentionally has no client SELECT; inspect with controlled privileged test role instead |
| Build/typecheck/lint | NOT RUN | No verified CI run |

## Important compatibility and security blockers
1. Broad REVOKEs will break existing direct writes, question generation and session creation. Audit and migrate callers before staging rollout.
2. Revoking only column-level privileges is insufficient while table-level SELECT remains granted. Script removes table grants first.
3. FORCE RLS does not override BYPASSRLS/superuser. SECURITY DEFINER owner and explicit auth.uid ownership checks require audit.
4. Current grading draft returns nextQuestionId=null and doesn't integrate existing XP/mastery system.
5. Student JWT must not be granted SELECT on reward outbox; adapt reward count check to a privileged, staging-only verification query.
6. No live staging test result can be claimed until a distinct isolated project is confirmed and tests actually run.

**Decision: NO-GO on PR #155 merge and production deploy.**
