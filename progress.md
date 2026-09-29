# progress.md — Dadyoom launch continuation

Updated: 2026-09-29

## Canonical release state

Repository: `mrahmedsamirhamam-ui/dadyoom`  
Release branch: `fix/mobile-cloud-video-final-20260923`

Do not destructively reset the working repository and do not blindly merge `main`. The release branch is intentionally the current production line while the historical branch divergence is handled separately.

## Closed

- Dadyoom Core: 22/22 Arab countries.
- National Official Match launch gate: 22/22 PASS.
- Final curriculum gate: PASS.
- TypeScript: PASS.
- ESLint: PASS.
- Tests: PASS.
- Security webhook tests: PASS.
- Vinext build: PASS.
- Cloudflare Workers build: PASS.
- Cloudflare Pages front door: `https://dadyoom.pages.dev`.
- Production deploy SHA synchronization: PASS.
- Full authenticated E2E / `npm run qa:full`: PASS.
- Six roles covered by autonomous QA: student / child / teacher / parent / school / admin.
- Real AI assistant smoke through `/api/ask`: PASS. AI video generation is intentionally excluded from this launch scope.
- Teacher dashboard 1101 mitigation: bounded lesson query.
- Admin curriculum/lessons stability: heavy prefetch disabled and large joins/queries bounded.
- Public scoped course catalog 5xx fix: nested PostgREST join replaced with bounded country → curriculum → grade → units → lessons reads.
- Critical public routes: Worker + Pages PASS for `/`, `/courses`, `/login`, `/pricing`.
- Public SEO smoke: home / robots / sitemap PASS.
- Google provider production health: PASS.
- Plus-page return navigation: implemented.
- Homepage visual transformation: implemented in release branch.
- Workers build commit metadata fix: implemented.
- Bing/IndexNow deploy notification: implemented.
- Android Native 1.0.2: signed/release updater path ready.

## Commerce

- Free + Plus.
- Plus price: 10 USD/month.
- Welcome trial: 24 hours.
- Paddle Sandbox checkout: PASS.
- Signed checkout user binding: PASS.
- Paddle signed webhook: PASS.
- Subscription activation: PASS.
- Billing portal/access: PASS.
- Cancellation flow: PASS.
- Idempotency: PASS.
- Payment-failure lifecycle: `transaction.payment_failed` now maps to `past_due` and is recorded as `payment_failed`.
- Paddle environment guard: fail-closed if Sandbox/Production does not match the client token/API key.
- Runtime readiness on 2026-09-29: `PADDLE=CONFIGURED PADDLE_ENV=sandbox`.
- Paddle Live / real-money collection is not enabled yet because production runtime still reports Sandbox. Switching to Live requires the external Paddle Live credentials/webhook configuration in the hosting environment and a controlled real payment test.

## Dadyoom Live

- LiveKit room UI exists and uses `LiveKitRoom`, `VideoConference`, audio and video.
- Teacher live-session creation exists.
- Student/teacher authorization is enforced through `edu_can_join_live_session`.
- RLS policies for live sessions and attendance are present.
- E2E now creates a temporary live class/session and verifies student/teacher access paths.
- Safe `/api/live/health` and admin readiness checks are implemented without exposing secrets.
- Runtime readiness on 2026-09-29: `LIVE=MISSING`.
- Remaining Live blocker is external only: set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in the production runtime. Do not invent or commit these values.

## Google AdSense

- AdSense technical integration: ready.
- Runtime readiness on 2026-09-29: `ADSENSE=CONFIGURED`.
- `ads.txt` and `google-adsense-account` metadata are wired from runtime configuration.
- Ads load only on the public homepage.
- No ads inside native mobile, student, teacher, school, lessons, pricing, login, or other learning-sensitive routes.
- Plus remains ad-free.
- Google final site/account approval remains an external verification step.

## External/manual verification remaining

These cannot be honestly marked PASS by code alone:

1. Set the three LiveKit production runtime values and run the same live-token smoke again.
2. Change Paddle runtime from Sandbox to Production with the user's real Live credentials/webhook endpoint, then perform one controlled real-money payment and verify activation + renewal/failure/cancel lifecycle.
3. Complete one real Google OAuth login with a human Google account and confirm return to the correct role dashboard.
4. Confirm Google AdSense final approval when Google finishes review.
5. Recheck Search Console and Bing Webmaster Tools after crawl/update propagation.
6. Visual QA of the latest homepage at desktop/mobile sizes after deployment.

## Explicitly deferred by current scope

- iOS signed device release / Apple Developer assets.
- AI video creation button / new on-demand AI video generation.
- New paid external services unrelated to the remaining launch items.

These two deferred items are not release blockers for the current closure scope.

## Safety locks

- Do not alter the completed 22-country curriculum merely to regenerate counts.
- Do not weaken Paddle webhook/signature/idempotency checks.
- Do not expose secrets in logs, docs, commits, or chat.
- Do not put ads anywhere except the public homepage.
- Keep Dadyoom development/temp/cache work on `G:`.
