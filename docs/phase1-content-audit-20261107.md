# Dadyoom phase 1 — content audit (2026-11-07)
Scope: Dadyoom main platform only. Read-only inspection; no school projects touched.

## Verified database results
The supplied 590 total / 468 published figures do not match the current public.lessons table.
Actual: **8461 total; 8314 published; 147 draft**. Published does NOT mean officially curriculum-complete.
Drafts by country: Bahrain 99; Palestine 30; Tunisia 8; Oman 7; Yemen 3.
**9 units have no published lesson**.

## Priority triage
Bahrain: grade 2 (31), grade 3 (26), grade 4 (20), grade 5 (10), grade 6 (8), grade 7 (1), grade 8 (2), grade 9 (1).
Palestine: grade 1 (6), grade 2 (12), grade 3 (12).
Tunisia: grades 10–13 (8 total; all lack lesson body; book indexes may intentionally lack body).
Oman: grades 10–11 (7 total). Yemen: grades 10–12 (3 total).
These are draft counts, not proof of missing official lessons.

## Reproducible detailed report
Run scripts/phase1-content-audit.sql against the **main Dadyoom project only**.
Query 2 produces the complete ordered list of all unpublished records by country, grade, unit, lesson and stable ID.
Diagnostic hints are NOT verified editorial reasons: there is no identified explicit rejection-reason column.

## Visibility acceptance criteria
A unit should be linked only if it contains at least one published lesson; a grade only if it contains at least one visible unit. Otherwise hide it or show a nonclickable «قريبًا».
Focus promotion on Egypt and the Gulf (Bahrain, Saudi Arabia, UAE, Qatar, Kuwait, Oman); keep all other countries in directory. Do not claim curriculum completeness.

## Inspected code / blockers
app/page.tsx has hard-coded mini-stats and homepage claims; this phase does not change them.
app/study/page.tsx was not found; locate the real navigation code before modifying.
No visitor UI or production change was deployed. No lint/build/tests were run in this connector environment.
Status: PHASE 1 REPORT ONLY; awaiting user approval before further implementation.