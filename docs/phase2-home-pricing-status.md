# Phase 2 — Home and pricing implementation status

Scope: Dadyoom main platform only. No school project or database changes.

## Changes committed
- `app/page.tsx`: simplified hero to «تعلّم العربية بمنهج بلدك وصفّك، مجانًا», shorter subtitle, primary «ذاكر الآن دون تسجيل», secondary «إنشاء حساب مجاني».
- Added Egypt and Saudi Arabia as top country entry points to the existing `/courses` directory; they are **not yet preselected** in a verified country-picker implementation.
- Added a visible section linking to the existing `/try` guest exercise. This exercise is **original, not sourced from a verified published curriculum lesson**. It must not be called a published official lesson.
- Removed four hard-coded mini-stats instead of showing unverified numbers.
- Linked existing `/pricing` from homepage header and footer.
- Preserved homepage alternate-name SEO text (ضاضيوم، داديوم) and existing layout metadata.

## Existing pricing inspected
`app/pricing/page.tsx` already provides free and Plus plan cards and gates checkout behind `DADYOOM_LIVE_BILLING_ENABLED`. The listed AI quotas and benefits were **not verified against backend enforcement**. Do not enable checkout or assert refund policy until actual implementation and policy route are verified.

## Not yet implemented / blockers
- Published lesson-backed interactive micro-lesson with a verified next lesson.
- Real active-student count and published-lesson count with configurable minimum (default 100 students). Hidden until validated backend query, definition of active student and settings are available.
- Approved testimonials and explicit owner consent workflow: hidden until verified schema/admin implementation.
- Four role cards repositioning and teacher-specific CTA: existing routing and access not yet verified.
- Country selector priority within the actual directory: navigation implementation not located.
- Refund policy route: not found among paths checked; cannot invent policy.
- Performance before/after measurements, automated lint/typecheck/test/build, mobile/desktop browser screenshots: **not run** with available GitHub contents connector. No claim of success or production readiness.

## Release gate
Do not merge or deploy until `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm run test:run`, `npm run build`, mobile and desktop browser checks, and before/after performance measurements pass. Preserve English site and ad behavior. Await user approval before phase 3.
