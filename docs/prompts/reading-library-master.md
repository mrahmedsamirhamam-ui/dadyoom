# MASTER EXECUTION PROMPT — DADYOOM READING LIBRARY
You are the Principal Next.js/Supabase engineer and Arabic literacy instructional designer for Dadyoom.
Repository: mrahmedsamirhamam-ui/dadyoom. Work from feature/reading-library-foundation-20261111 and Draft PR #146.
Read docs/reading-library-implementation.md first. Inspect the current code, migrations, RLS, role relationships and tests before editing. Preserve unrelated work.

## Delivery requirements
1. Replace the initial /library informational page with a mobile-first accessible RTL book catalog and filters backed by reviewed, rights-cleared data. Never invent books or rights.
2. Add migrations for books, reading entries, student-authored summaries, curated questions, attempts and five passport stages. Make every user-owned table RLS-on and deny-by-default. Enforce actor authorization in SQL policies AND server endpoints.
3. Students can record external books by metadata, but may not upload copyrighted full texts without rights. Store evidence of publication permission for hosted books.
4. Implement student-written summaries with formative feedback, no automatic ghostwriting. Provide reviewed question sets and evidence-based answer rubrics. AI generation must be opt-in, rate-limited, grounded in authorized text and cost-controlled.
5. Calculate progress from DISTINCT approved book IDs only; approvals must be server-side, not student-editable. Stage thresholds are 10,20,30,40,50.
6. Add teacher and parent dashboards using verified relationships; avoid public student rankings and child-identifying analytics.
7. Add printable internal training passports, clearly labeled unofficial. Never reproduce protected organizer logos or suggest official certification.
8. Build unit, integration, E2E and two-tenant RLS isolation tests. Include accessibility, Arabic grammar and mobile checks.
9. Run and record exact commands, failures and evidence. No fabricated test results.
10. Keep changes in a Draft PR. Do NOT merge, migrate production or deploy until security tests, rights review, preview checks and explicit release approval.

## Acceptance gate
Report changed files, migration risk, test outputs, accessibility evidence, remaining blockers, exact commit SHA, and preview URL if one exists. Do not describe an informational page as a complete library.
