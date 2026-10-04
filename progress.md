# progress.md — Dadyoom production state

Updated: 2026-10-04

## Canonical release state

Repository: `mrahmedsamirhamam-ui/dadyoom`  
Release branch: `fix/mobile-cloud-video-final-20260923`

Do not destructively reset this branch and do not blindly merge `main`.
This branch is the active production line.

## Production status

- Cloudflare Worker: deployed and healthy.
- Cloudflare Pages: deployed and healthy.
- Production SHA synchronization: PASS.
- Cloudflare Verify: PASS.
- Mobile Final Verify: PASS.
- Production Role QA: PASS.
- Final authenticated release gate: PASS.
- No current code search hits for `TODO`, `FIXME`, or `BLOCKED`.
- No secrets are committed or printed by release checks.

## Curriculum

- Dadyoom Core: 22/22 Arab countries.
- National official match launch coverage: 22/22 countries.
- Secondary Grades 10, 11, 12:
  - all 22 countries present;
  - every country/grade has at least one documented official curriculum node;
  - every country/grade has at least 18 published Dadyoom Core support lessons.
- Grade 13 support:
  - Tunisia: official curriculum + 18 Dadyoom Core lessons.
  - Mauritania: official curriculum + 18 Dadyoom Core lessons.
- Secondary catalog now exposes the complete view:
  official documented curriculum + clearly labelled Dadyoom supporting lessons.
- Official and Dadyoom-authored material remain clearly separated; no invented ministry lesson titles are used where an official source does not publish lesson-by-lesson sequencing.
- Secondary curriculum coverage is enforced by Production Role QA so later releases cannot silently regress it.
- Sudan Grade 10 official Arabic curriculum has detailed official coverage.
- Tunisia secondary official Arabic coverage has been expanded from official CNP sources.
- Algeria secondary Arabic tracks have expanded official coverage.

## Roles and product E2E

Autonomous role QA covers:
- student;
- child;
- teacher;
- parent;
- school;
- admin.

Verified product flows include:
- role routing;
- student dashboard;
- four skills;
- daily challenge;
- streak;
- teacher class flows;
- school flows;
- marketplace;
- BPay manual checkout;
- teacher/course earnings accounting;
- course live rooms;
- school teacher meetings;
- temporary test-data cleanup.

## Dadyoom Live

- LiveKit production configuration: READY.
- `/api/live/health`: `ok=true`, `configured=true`, provider=`livekit`.
- Student live token/access: PASS.
- Teacher live token/access: PASS.
- Course live room flow: PASS.
- School meeting creation: PASS.
- School teacher meeting access: PASS.
- Camera, microphone, chat, screen sharing and room links remain implemented through LiveKit.

## Marketplace and BPay

- Teacher can create, price, schedule and publish a course.
- Paid course publication requires teacher BPay setup.
- Student can submit a BPay reference.
- Teacher confirmation activates the purchase.
- Earnings accounting records:
  - 15% platform fee;
  - 85% teacher net.
- BPay reference uniqueness is enforced in the database.
- BPay is manual settlement: it does not automatically split bank funds between Dadyoom and the teacher.
- No real charge is executed by QA.

## Plus / Paddle

- Free + Plus product remains implemented.
- Plus price: 10 USD/month.
- Paddle Sandbox checkout and webhook lifecycle: implemented/tested.
- Production runtime remains intentionally Sandbox until explicit approval to switch to Live.
- Do not perform a real Paddle payment without explicit user approval.
- Live switch still requires the complete Live credential/webhook configuration.

## Google OAuth

- Google provider production health: PASS.
- OAuth contract checks: PASS.
- Login navigation/RSC overlap issue fixed.
- A real human Google-account sign-in remains an external/manual confirmation step.

## Android

- Native Android path remains intact.
- Native Android build/release checks have passed after the production changes.
- Do not remove or replace the existing Android path.

## iOS

- Signed iOS release remains intentionally deferred.
- No Apple Developer paid membership is required for the current scope.
- Do not introduce a paid Apple requirement without explicit approval.

## AI video

- On-demand AI video generation remains intentionally disabled / Soon.
- Do not enable it or add a paid replacement service.

## SEO / indexing

- Canonical site: `https://dadyoom.dpdns.org`.
- robots.txt: PASS.
- sitemap.xml: PASS.
- Google static verification file: PASS.
- SEO health: PASS.
- Login/signup: noindex, nofollow.
- ads.txt: served.
- IndexNow key: PASS.
- IndexNow submit: PASS after production deploy.
- Dynamic lesson sitemap access: configured.
- Bing verification token itself is not configured; IndexNow remains active.

## AdSense

- Technical integration and ads.txt are ready.
- Ads remain restricted to the public homepage.
- Plus remains ad-free.
- Google final account/site approval is external and cannot be marked complete by code.

## Performance / Cloudflare

Mitigations applied to reduce Worker 1101 / CPU pressure:
- student dashboard bounded;
- reading challenge bounded;
- teacher marketplace bounded;
- teacher dashboard bounded;
- teacher class detail SSR made worker-safe;
- school dashboard split from heavy analytics;
- school meetings SSR lightened;
- notification/auth/navigation prefetch storms reduced;
- public catalog queries bounded;
- SSR locale-sensitive date formatting replaced where it caused Worker failures.

Latest successful release QA showed no release-gate failure from these previously fixed paths.

## External/manual items only

The remaining items are not missing application code:

1. Paddle Live activation and one controlled real-money payment — requires explicit user approval.
2. Google AdSense final approval — controlled by Google.
3. One real human Google OAuth login confirmation.
4. Bing Webmaster verification token if desired.
5. Signed iOS release / Apple Developer assets — intentionally deferred.
6. AI video generation — intentionally deferred.

## Safety locks

- Do not alter official curriculum titles merely to improve counts.
- Keep official curriculum and Dadyoom support content visibly distinct.
- Do not weaken payment webhook/signature/idempotency checks.
- Do not expose secrets in logs, docs, commits, or chat.
- Do not put ads in learning-sensitive routes.
- Do not break Android.
- Do not enable AI video.
- Do not introduce new paid services without approval.
