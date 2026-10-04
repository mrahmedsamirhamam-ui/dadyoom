## 2026-10-04 — Secondary curriculum continuation + production sync

- Production deployment gap resolved: Worker and Pages moved from the stale September build to commit `a795b8290c16be118695f2c8f69cb00b0ad68874` on the working branch. A guarded `.github/workflows/cloudflare-deploy.yml` was added at commit `8cd7d9579fd1f40dcec80fb313e098a4bbc49731`; it deploys only when Cloudflare repository credentials are configured and never prints secrets.
- Production health after sync: AI health `ok=true`; Google provider `google=true, configured=true`; LiveKit `ok=true, configured=true`.
- Algeria G12 science source was corrected from a non-official mirror to the official Ministry PDF; 12 production lessons now reference the Ministry source.
- Mauritania detailed official secondary Arabic added from IPN/Koutoubi 2025 textbooks:
  - G11 literary: 4 units / 39 lessons / 117 questions / 117 activities.
  - G11 scientific: 4 units / 24 lessons / 72 questions / 72 activities.
  - G12 literary: 4 units / 34 lessons / 102 questions / 102 activities.
  - G13 literary: 4 units / 50 lessons / 150 questions / 150 activities.
- Mauritania G13 literary production API verification: PASS.
- No invented titles were added for sources whose public official TOC is unavailable or OCR-corrupted. Current detailed blockers include Mauritania G12/G13 scientific TOCs, Sudan G11/G12, Yemen, Syria, Iraq, Kuwait, Morocco, Qatar, Somalia, Djibouti and Comoros. Those remain official book/grade/standards coverage bundles until a clean official detailed source is obtained.
- Jordan G11 current 2026-2027 Semester 1 enrichment:
  - 5 official units / 25 structured skill lessons / 75 questions / 75 activities.
  - Production API PASS, including «من القيم الإنسانية في القرآن الكريم», «التعليم التقني بوابة المستقبل», and «أبني لغتي».
  - Semester 2 was not fabricated; it remains pending a current 2026-2027 official NCCD publication.
- Mauritania G10 / 4AS official detailed enrichment:
  - 4 units / 43 official lessons / 129 questions / 129 activities from the 2025 IPN textbook TOC.
  - Supabase migration applied successfully and production API PASS.
- Djibouti secondary enrichment:
  - G10 Seconde: 13 official programme units/domains, 46 verified topics, 138 questions, 138 activities.
  - G12 Terminale: 14 units/domains, 44 verified readable official topics, 132 questions, 132 activities; 4 OCR-unresolved official slots intentionally not guessed.
  - G11 Première remains at official L/ES/S/SG series-bundle level because no accessible detailed CRIPEN programme file was found.
- Tunisia secondary remains correctly represented by official CNP textbook nodes (2/3/3/4 books for G10/G11/G12/G13); book titles are official, but lesson-level expansion is intentionally not fabricated.
- TinyFish interactive browser automation is currently unavailable because its wallet is below zero; static fetch/search and other project tools remain usable.

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


## 2026-10-04 — Secondary official-depth continuation (Mauritania scientific + Yemen + catalog cleanup)

- Mauritania official IPN/Koutoubi scientific-track expansion completed from the current 2025 textbooks linked by Koutoubi:
  - G12 scientific: 4 units / 29 verified lesson-topic titles / 87 original Dadyoom questions / 87 original activities.
    - Official page: https://koutoubi.mr/secondaire2/6eme/Arabe/
    - Official-linked PDF: https://docs.bsimr.com/pdfs/secondaire2s/AR-6AS-M.pdf
    - Migration: `20261004203000_enrich_mauritania_g12_scientific_official_arabic.sql`
  - G13 scientific: 4 units / 28 verified lesson-topic titles / 84 original Dadyoom questions / 84 original activities.
    - Official page: https://koutoubi.mr/secondaire2/7eme/Arabe/
    - Official-linked PDF: https://docs.bsimr.com/pdfs/secondaire2s/AR-7AS-CD.pdf
    - Migration: `20261004204500_enrich_mauritania_g13_scientific_official_arabic.sql`
  - Both migrations applied successfully to production Supabase and are visible through the live course catalog.
- Kuwait 2026/27 secondary metadata corrected against current Ministry decisions:
  - Masarat is an approved regulation from 2026/27.
  - Current initial rollout is optional for Grade 10 applicants in 12 designated schools.
  - The legacy secondary system remains for learners outside that rollout.
  - No unverified secondary Arabic lesson sequence was invented.
- Yemen official secondary book-level evidence deepened from the Ministry e-learning grade indexes without inferring unavailable lesson TOCs:
  - G10 verified book nodes: النحو والصرف؛ الأدب والنصوص والبلاغة.
  - G11 verified book node: الأدب والنصوص والبلاغة.
  - G12 verified book nodes: النحو والصرف؛ الأدب والنصوص والبلاغة؛ القراءة.
  - Migration `20261004210000_expand_yemen_secondary_official_book_nodes.sql` applied successfully.
  - Resulting official-node totals (including the retained grade bundle fallback): G10=3, G11=2, G12=4.
- Public catalog duplicate cleanup completed:
  - `app/api/courses/catalog/route.ts` now suppresses the older generic `المطابقة الرسمية` bundle only when the same country/grade has a detailed official curriculum with at least 10 published lessons.
  - Dadyoom Core is never hidden.
  - Bundle/domain fallback remains visible for countries/grades where deeper official public evidence is unavailable.
  - Production verification PASS:
    - MR G12: scientific + literary + Dadyoom Core; generic bundle hidden.
    - DJ G10: detailed official + Dadyoom Core; generic bundle hidden.
    - JO G11: detailed official + Dadyoom Core; generic bundle hidden.
    - YE G12: fallback official bundle retained and new verified book nodes visible.
- Source-discipline blockers remain intentionally unexpanded rather than guessed:
  - Sudan G11/G12: older national-curriculum PDFs are discoverable in public archives, but current 2026/27 applicability is not sufficiently established.
  - Iraq: official catalog remains bot-blocked to automated extraction.
  - Syria: current Ministry curriculum host is live but secondary Arabic PDF/index paths are not publicly indexed enough for safe title extraction.
  - Somalia: current Ministry sources establish the national curriculum/secondary framework but not a public grade-by-grade Arabic TOC.
  - Comoros: Ministry evidence confirms Arabic in secondary education but no public current grade-level official Arabic TOC was found.
  - Qatar/Morocco/Tunisia/Lebanon/UAE/Oman/Kuwait: retain verified bundle/domain/book-level scope where current detailed official lesson sequences are not safely extractable.
- Oman current 2026/27 Arabic guidance bulletin was located on the Ministry domain (74-page flipbook). Its HTML pages expose image-only page content to the available extractor, so no lesson titles were inferred from it.
