# Dadyoom — educational-platform feature gap and staged execution decision
**Decision date:** 2026-11-10 · **Status:** specification / review only · **Owner directive:** reuse useful features advertised by a third-party platform without copying its content, design or branding.

## Source of request and evidence limitations
A user-supplied screenshot of a sponsored Facebook post described: branded learning platforms, always-available AI assistance, unlimited live teaching with automatic recording, anti-copy/screen-capture measures, and student/course/test administration. These are **advertising claims, not independently verified product capabilities**. No external code or artwork has been copied.

Repository source inspected: `features/ai-tutor/actions/askLessonTutor.ts`, `features/teacher/actions/`, `features/live/actions.ts`, plus `app/api/ai`, `app/api/live`, `app/api/teacher`, `app/api/video` on `main` (file and route presence only). Existing open PRs include #88 guided tutor, #99 teacher feedback, #116 login UX, #122 curriculum source audit, #133 and #143 P0 role security, #142 CI evidence. **Presence in Git or a draft PR does not establish a working, merged, deployed, safe or fully tested feature.**

## Product boundary
- **Dadyoom (this repository):** Arabic learning and verified curriculum pathways, four learning-facing roles, contextual `ضاد`, enrichment by teachers, tests, progress, academic content trust.
- **Dadyoom School OS (independent product):** tenant management, school and teacher licensing, institution workflows, conferencing/recordings. Contract via explicit versioned APIs only; never couple databases or enable implicit cross-product access.
- **Dadyoom International Schools:** first isolated pilot, not a substitute for independently verified School OS product readiness.
- No new paid providers, subscriptions, overages, real minor accounts, unsanctioned publication or provider keys in the repository.

## Review / delivery matrix
| Advertised capability | Repository evidence / limits | Dadyoom scope | Release condition |
| --- | --- | --- | --- |
| Contextual AI answers 24/7 | Tutor action and AI API already exist; response quality, uptime, cost and authorization not proven | Extend one `ضاد` assistant **inside the actual lesson**; explain/hint/check understanding, cite lesson context, say "لا أعلم" when context unavailable | Verified lesson id + identity, bounded prompt/context, grounded answers, rate/cost limits, no answer-key leakage, safety tests |
| Teacher content/duties/tests management | Teacher actions, assessment and classroom directories are present | Improve existing teacher experience instead of parallel admin portals; differentiable lesson enrichment with draft/review/publish checkpoints | Authenticated teacher authorization and server-side RLS, curriculum provenance, end-to-end creation and readback |
| Learner progress and automated grading | API/feature directory presence only; open P0 security/grading PRs | Reuse secure server-graded assessments and evidenced mastery | Fail-closed role authorization, protect answer keys, independent exact-head regression tests |
| Teacher-branded platform | No production tenant isolation or custom domain proven here | **Do not build an independent multi-tenant school SaaS inside Dadyoom**; link to School OS via explicit versioned contract | Tenant-isolated School OS license pilot with approval and contractual data scope |
| Live lessons / auto recording | Live routes exist; no validated unlimited bandwidth or recording proof | Link to approved School OS/virtual-school live class only when verified | Real authenticated conference and recording lifecycle with opt-in and retention controls |
| Anti-theft / anti-screen-recording | No software can fully prevent external-camera capture | Legal permissions, signed media links, expiry, visible watermark, audit and reporting—not absolute prevention claims | Authorization/TTL tests and content license review |

## Implementation sequence and acceptance
### P0 — blocking existing defects (before new-facing launch)
1. Preserve **NO_GO** for role escalation and grading until review of #143/#142/#133 and **real isolated-role DB/browser checks**, not only CI source checks.
2. Make existing login/session and learner role destination work before adding another role/teacher storefront. PR #116 is draft until verified.
3. Validate lesson body and curriculum provenance for country/grade/year; do not mistake published-row counts for curriculum completeness. Preserve 22-country evidence gating and grades 1–3 priority.

### P1 — narrow, useful pilot within the existing lesson
1. Single `ضاد` interaction entry point: `تبسيط`, `تلميح`, `اشرح الخطأ`, `اختبر فهمي`. Do not expose the answer before a learner attempt unless explicitly appropriate.
2. Request schema: authenticated/guest capability scope, stable lesson ID, country/curriculum/grade/year reference, action enum, bounded learner utterance, idempotency key. Never accept raw client-supplied role for privileges.
3. Retrieve lesson context from authorized source; exclude keys, other students' data and unverified ministry text. AI-generated responses must disclose uncertainty and cannot claim official curriculum provenance.
4. Provider budget: reuse available approved route, caching, per-user usage ceiling, deterministic fallback; **no unlimited guarantee**.
5. Acceptance: Arabic language accuracy review, no hallucinated official texts, RTL mobile/keyboard and low-bandwidth, 4-role boundary tests, privacy redaction, unauthorized prompt-injection and rate-limit tests.

### P2 — teacher workflow integration
- Use existing teacher action paths; teacher adds enrichment to known curriculum lesson, attaches originally authored or permitted media, creates formative quiz, reviews before publication. No duplicated teacher product and no auto-publish.
- Acceptance: unauthorized school/teacher/client-role mutation rejected; pre/post write readback; rollback/restore procedure, accessibility smoke, school/parent views with least privilege.

### P3 — School OS integration (future gated work)
- `GET /integration/v1/capabilities` should be an authenticated, **read-only** feature manifest (design contract only; **not implemented**). Tenant scope and permission claim are verified server-side at both boundaries.
- Live room and branded teacher portal must remain inside School OS; Dadyoom exposes links only to proven, explicitly allowed capabilities.

## Release gates — fail closed
- Evidence: actual file diffs, exact commit SHA, successful TypeScript, lint, unit tests, production build, real-browser role/lesson checks, isolated DB RLS tests, approved provider/configuration budgets.
- Child protection/rights: no real learner data in staging, tenant and parent/guardian consent, consent for recording where applicable, deletion/export policy, moderation and audit logs.
- Business truth: never assert 24/7 availability, "unlimited" sessions, universal screen-capture prevention, official ministry certification or 100% curriculum without verified evidence.
- **This document is a plan, not production code or proof of implementation. No merge, deployment, production mutation or external purchase is authorized by this commit.**

## Current decision and IP traceability
Review before coding; preserve every existing PR and source contribution. Keep third-party ad content only as requirement inspiration, not source code. Original Dadyoom implementation remains independently authored and checked for third-party licenses. Git history and this specification record a dated development decision, **not a registered trademark, copyright filing, or independent proof of exclusive ownership**.
