# Dadyoom — Global Arabic learning foundation

## Purpose
Support Arabic learners worldwide without conflating national curricula with an international language-proficiency pathway.

## Implemented in this branch
- A pure, testable adaptive recommendation engine for seven Arabic-language skills.
- Goal and preferred presentation mode as typed inputs.
- Conservative progression: no automatic advancement with fewer than three attempts; strong evidence is required for advancement.
- No personal data, external AI calls, database writes, subscriptions, or paid dependencies.

## Not implemented
This foundation is **not** a deployed learner journey, a validated proficiency assessment, a speech-recognition system, or an AI tutor. No new curriculum content is fabricated. The interface language field is metadata, not a translation service.

## Integration checklist
1. Verify current production lesson/skill mappings and official curriculum provenance.
2. Collect explicit, age-appropriate learner preferences with accessible alternatives.
3. Aggregate only authorized, server-validated attempts; do not trust browser-provided scores.
4. Connect this pure function to a protected server route; validate inputs and ownership.
5. Display a recommendation with an explanation and allow learners/teachers to override it.
6. Test RLS, roles, accessibility, RTL/LTR, localization, keyboard, mobile, performance and consent.
7. Run typecheck, lint, unit tests, build and browser smoke tests before merging and deploying.

## Safety
Do not store children's chat or speech by default. Do not claim a CEFR level based on this heuristic. Official school grades and teacher-approved assessments must remain separate.
