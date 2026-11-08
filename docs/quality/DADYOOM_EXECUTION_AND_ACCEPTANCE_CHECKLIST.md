# Dadyoom 2036 — Executable Work Order and Acceptance Checklist

This is a task specification, not evidence of completion. Use synthetic users/data and isolated preview. Do not modify production or merge without owner approval.

## Work order P0 — security (complete before P1 implementation)
1. Inventory current auth, role sources, tenant membership, RLS policies, grading, answer keys, audit logs, backup schedule, monitoring and CI.
2. Write authorization matrix by actor/action/resource and tenant scope.
3. Implement only smallest justified fix on separate branch after code inspection; never bypass RLS with service-role in user-facing requests.
4. Add automated tests: student->teacher denial; teacher->school admin denial; school admin->super admin denial; student A->B denial; parent->unlinked child denial; school A->B denial; forged score and answer key denial; missing/invalid/expired JWT; IDOR/injection.
5. Verify backup schedule and run isolated restore; do not mark passed without logs.
6. Record test commands, pass/fail counts, CI URLs, and remaining risks. NO-GO if high/critical blocker persists.

## Work order P1 — DACF
- Review existing draft PR #140 and prior curriculum/adaptive PRs before writing code.
- Publish leaf competency descriptors and non-overlapping scoring mappings.
- Require assessment blueprint, rubric version, official topic source and review status.
- Bahrain grades 1–3: verify each official topic with edition, title, reviewer, Dadyoom lesson mapping and evidence. Unknown source = unknown coverage, never 100%.
- Acceptance: deterministic contract tests pass with synthetic data; no double counting; unauthorized evidence rejected.

## Work order P2 — learner growth and AGI
- Equated pre/post forms or common calibrated scale, confidence intervals and adequate sample size.
- Test identical ability with unequal form difficulty; duplicate attempts; missing baseline; score forgery; incomplete coverage; and retention assessment.
- AGI is experimental until psychometric validation. Publish uncertainty and data completeness.

## Work order P3–P5 — adaptive, Dad AI and games
- Every intervention maps to DACF skill and has baseline, treatment, follow-up and comparison design where possible.
- Test age-appropriate content, teacher review, hallucinations, privacy, abuse, model spend, and failure fallback.
- XP/engagement is not evidence of skill gain. Measure verified improvement, retention and subgroup fairness.

## Standard report
Completed (verified evidence) / In progress / Not implemented or unverified / Risks / Next single priority / Executive GO or NO-GO / Test logs / Impact. Close one priority before starting the next.
