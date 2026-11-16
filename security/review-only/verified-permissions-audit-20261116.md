# P0 — Verified Supabase permissions audit (read-only, 2026-11-16)

**Production database was NOT modified. NO-GO remains.** Project inspected: Dadyoom (not DIS).

## Observed (catalog-level, not an adversarial PostgREST test)

| Table | RLS enabled | FORCE RLS | authenticated SELECT/UPDATE/DELETE |
|---|---|---|---|
| ai_assessments | yes | no | yes/yes/yes |
| assessment_sessions | yes | no | yes/yes/yes |
| assessment_session_answers | yes | no | yes/yes/yes |
| questions | yes | no | yes/yes/yes |

Column privilege inspection reports authenticated SELECT and UPDATE on `correct_answer` for `ai_assessments`, `assessment_session_answers`, and `questions`. Some anon grants exist too, but row-level policy restrictions must be tested separately. This **does not prove** a student can read all rows; it proves table/column grants do not independently prevent it.

Existing RLS policies for assessment sessions and answers grant authenticated users `ALL` on own `student_id` rows; `ai_assessments` grants owner-email SELECT, INSERT and UPDATE. This allows client-side mutations of score/answer rows in principle, subject to actual PostgREST access. Do not describe this as fixed.

## Required isolation-first closure

1. Create a disposable Supabase project (NOT the production Dadyoom or DIS project); reproduce schema, policies and seed synthetic accounts/lesson/questions.
2. Design separate student-readable views that **omit** correct answers, and server-only grading tables/columns. Review ALL existing frontend/API SELECT and INSERT consumers before revoking table-wide privileges.
3. Implement atomic grading RPC, verify auth.uid ownership, attempt row lock, UNIQUE(session_id,assessment_id), next-question assignment and transactional reward ledger. Restrict EXECUTE to authenticated, no PUBLIC/anon, review SECURITY DEFINER owner and search_path.
4. Test PostgREST as an actual student: SELECT correct_answer, UPDATE scores, DELETE answers, INSERT forged awards. Expect denials.
5. Run 10 parallel requests for same session/question; exactly one success, nine 409; exactly one answer and one ledger award.
6. Verify onboarding and existing client API payloads, build/typecheck/lint and end-to-end learning flow. Keep PR draft and NO-GO until all pass.

## Existing draft limitations

`security/review-only/atomic-assessment-draft.sql` has **not been applied or tested**. It returns `nextQuestionId:null`, uses a pending reward outbox rather than the legacy XP system, and contains broad REVOKEs requiring consumer compatibility analysis. The route will return 500 if the RPC is absent. The PR must not be merged/deployed.
