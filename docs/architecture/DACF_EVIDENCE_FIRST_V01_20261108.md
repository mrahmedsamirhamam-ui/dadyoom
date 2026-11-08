# DACF v0.1 — evidence-first review contract (NOT production enabled)

Status: **REVIEW ONLY**. This document specifies an additive measurement contract; it does not change database grants, RLS, scoring, learner records, or deployed services.

## Scope and reuse
- Reuse the official-topic evidence contract from PR #136; do not count activities or lesson rows as verified curriculum coverage.
- Reuse existing objective/evidence architecture in PR #134 and adaptive recommendation work in PR #138 after review. Do not duplicate those engines.
- Security blockers #57 (answer keys/client grades), #117 (role promotion), and #46 (Cloudflare build) remain stop-ship.

## Competency taxonomy
Top-level domains: reading, reading_comprehension, writing, spelling, syntax, morphology, listening, conversation, written_expression, oral_expression, vocabulary, rhetoric, literary_appreciation, critical_language_thinking.
These are **reporting facets**, not fourteen statistically independent scores. Define non-overlapping leaf competencies and mapping weights before aggregation; writing/written_expression and reading/reading_comprehension may share evidence without double-counting.

## Evidence event v0.1
Required: evidence_id (UUID), learner_id (authorized subject), tenant_id (where applicable), competency_id, assessment_blueprint_id, assessment_form_id, rubric_version, source_type, scored_at, score, score_range, assessor_type, scoring_method, evidence_quality, curriculum_source_version.
Optional: lesson_id, reviewed_official_topic_id, confidence_interval, teacher_review_id, accommodations, locale.
Server generates learner/tenant identity and scored_at. Never trust client-submitted score, XP, correct_answer, is_correct, tenant_id, or assessor role. The score must come from an authorized server grader or verified human assessment. Record provenance without storing raw student speech/text in analytics by default.

## Growth decision
1. Baseline and follow-up must assess the same leaf competency with equated forms or a defensible common scale.
2. Require sufficient independent evidence and report uncertainty; otherwise state 'insufficient evidence', not 'no growth'.
3. Growth is not lesson completion, clicks, game XP, or raw percentage-point change across unequal forms.
4. Interventions must be logged with start/end, target skill, assigned educator, and outcome measurement. Causal effectiveness requires comparison design; pre/post alone is descriptive.
5. Predictive next-month scores are disabled until calibrated longitudinal data, subgroup fairness tests, and uncertainty bands exist.

## Bahrain grades 1–3 mapping acceptance
For every grade, term, track, and official book edition: source URL/document identifier; source publication/version; official topic identifier and exact title; reviewer and review date; linked original Dadyoom lesson; independent flags present / complete / published / official-match; leaf competencies; observable performance descriptors; evidence blueprint. Missing official index => coverage 'unknown', never 100%.

## Security and acceptance gates
- JWT tests: anonymous, student A, student B, teacher, parent, school A, school B, administrator; verify both allowed and denied access and cross-tenant isolation.
- Real preview RLS tests for role immutable profiles and denied direct grade/answer-key access.
- Assessment tests: forged client scores, duplicate evidence IDs, cross-tenant writes, unsupported form equivalence, missing rubric, and insufficient evidence must fail closed.
- Fairness review across grade, dialect, language-background and accommodations before comparative dashboards.
- Teacher-reviewed pilot with consent; no real student data in development fixtures.
- No merge, SQL migration, deployment, external paid service, or real learner activation without separate owner approval.

## Implementation sequence
P0 inventory and secure authorization first. Then build a pure deterministic DACF contract validator and fixture tests, map a small verified Bahrain topic sample, and pilot growth calculations in a synthetic-data sandbox. Do not label tests as passed until actual CI logs exist.
