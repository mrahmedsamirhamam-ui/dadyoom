# Dadyoom Final Closure Status — 2026-09-25

This file records the verified project state after the 2026-09-25 closure pass.
It distinguishes verified technical readiness from intentionally deferred or
external work. It must not be used to claim national-ministry completeness
without evidence.

## Verified technical gates

Authoritative GitHub Actions run:

- Workflow: `Mobile Final Verify`
- Run ID: `36112148757`
- Head: `ccf6af41ac59d6ee0715cc18e78aaca03ca21b3f`
- Conclusion: `SUCCESS`

Passed in that run:

- TypeScript
- Full ESLint
- Dependency audit at high-severity gate
- Product source audits
- Curriculum and content verifiers
- Unit/integration tests
- Security webhook tests
- Production AI/auth health smoke
- Production home/robots/sitemap smoke
- Mobile/PWA verifier
- Shell/PowerShell/Kaggle syntax
- Vinext production build

The normal push workflow does not fail when the GitHub service-role secret is
missing. In that case the Authenticated product E2E step prints an explicit
BLOCKED marker. The final closure script is fail-closed and must configure the
secret locally before deployment.

## Production AI/auth

Verified in the release workflow:

- Production AI health: PASS
- Production Google provider: PASS
- Gemini keys visible to the safe health summary: 2
- No secret values are exposed.

## Android

Latest public native release:

- Dadyoom Android 1.0.2
- Tag: `dadyoom-mobile-v1.0.2`
- Stable asset: `Dadyoom-Android-release.apk`
- Native OAuth deep link: verified in build
- Native Arabic TTS: wired
- Offline Qwen model: embedded
- In-app native update checker: wired
- PWA remains backup only

## iOS

- Native iOS application has been built previously, including the offline Qwen
  device resource.
- Stable public installation is intentionally deferred because no paid Apple
  Developer membership will be purchased at the current zero-cost stage.
- Website status remains: iPhone native — coming soon.

## Dadyoom Core — live database truth

Live Supabase audit on 2026-09-25:

- Active Arab countries: 22
- Core curricula: 22
- Grades: 264
- Units: 792
- Published lessons: 4,752
- Assessment questions: 23,760
- Lesson activities: 14,256
- Vocabulary rows: 14,256

Per country, verified live:

- 12 grades
- 36 units
- 216 published lessons
- 1,080 assessment questions (5 per lesson)
- 648 lesson activities (3 per lesson)
- 648 vocabulary rows (3 per lesson)

All 22 country Core gates: PASS.

## National Official Match

This is deliberately separate from Dadyoom Core.

Current truthful closure state:

- National Official Match complete: 0 / 22
- Partial evidence/mapping exists for: BH, EG, JO, LY, PS
- Other countries remain candidate/not-closed (SY additionally needs source
  verification).

A country must not be marked nationally complete until its required grade/stage,
term, unit and lesson/topic hierarchy is supported by auditable national
evidence and provenance. Original Dadyoom prose must never be presented as
ministry textbook prose.

## Welcome trial and payments

- New-user Plus welcome trial: one day.
- Production trigger `trg_edu_welcome_trial` restored on `auth.users`.
- Paid Plus checkout: intentionally paused.
- Paid course purchase: intentionally paused.
- Tap/Paddle public charge creation remains fail-closed.
- PayPal is not used.
- This preserves the current zero-cost product decision.

## Security

Verified live:

- Internal parent/school link-code generators are not executable by anon or
  authenticated clients; service_role only.
- Exposed SECURITY DEFINER RPCs reviewed in the closure pass have visible
  requester/role authorization guards.
- Main security webhook tests pass.
- Supabase advisor still reports performance/info findings and structural
  SECURITY DEFINER warnings; these are maintenance items, not evidence that the
  verified guarded RPCs are publicly unprotected.
- npm audit has no high/critical issue at the enforced gate. Three moderate
  findings remain in the Capacitor CLI/xcode/uuid development-tool chain; npm's
  proposed forced fix is a breaking toolchain change, so it is not applied to a
  stable native build without an upstream-safe upgrade.

## Production SEO

Verified from GitHub Actions against the public Worker:

- Home page HTTP 200
- robots.txt HTTP 200
- sitemap.xml HTTP 200
- robots sitemap reference: PASS
- manifest/PWA metadata checks: PASS

## Final authenticated closure

One local command remains before declaring the latest branch deployed after a
real authenticated browser E2E:

```powershell
Set-Location "G:\ضاضيوم\dadyoom"
& ".\scripts\dadyoom-final-closure.ps1"
```

The script:

1. refuses to switch away from the required branch,
2. syncs the branch,
3. reads the Supabase service-role key from local `.env.local` without printing
   it,
4. stores it as a GitHub Actions secret,
5. dispatches `Mobile Final Verify`,
6. requires the authenticated browser E2E to pass,
7. only then deploys to Cloudflare,
8. verifies production AI health and Google provider.

No service-role key should ever be pasted into chat.

## Deferred / external items

These are not silently marked complete:

1. National Official Match 22/22 — evidence acquisition and verification.
2. Stable public iOS signing/distribution — Apple paid membership intentionally
   deferred.
3. Paid billing activation — intentionally paused for the zero-cost stage.
4. LiveKit-backed live classroom hosting — requires external LiveKit runtime
   credentials/service and is not forced at the zero-cost stage.
5. Custom domain / Search Console ownership, if desired — external account-level
   setup; the Worker SEO endpoints themselves currently pass.
