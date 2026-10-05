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
- No invented titles are added when a current public official TOC is unavailable or OCR-corrupted. Mauritania G12/G13 scientific, Yemen book nodes, and Djibouti G10/G12 have since been enriched and verified. Remaining source-depth blockers are Sudan G11/G12, Syria, Iraq, Somalia, Comoros, Djibouti G11, and countries where the current official publication is only verifiable at book/domain/bundle level (including Kuwait, Morocco, Qatar, Tunisia, Lebanon, UAE and Oman).
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


## 2026-10-04 — Database security/performance hardening

- Public course-catalog duplication fixed in `app/api/courses/catalog/route.ts`:
  - when a country/grade has a detailed official curriculum (>=10 published lessons), the older generic `المطابقة الرسمية` bundle is hidden from the public catalog;
  - Dadyoom Core remains visible;
  - bundle/domain fallback remains visible when no detailed official curriculum exists.
- `get_lesson_page_bundle(uuid)` changed from `SECURITY DEFINER` to `SECURITY INVOKER` after verifying that published lesson/question/activity access and caller-owned progress/attempt/tutor access are already protected correctly by RLS.
  - anonymous RPC test PASS: published lesson + questions + activities returned, student payload remains null.
- Duplicate database indexes/constraints removed safely:
  - one duplicate `lesson_activities(lesson_id)` index removed;
  - one duplicate `student_memory(student_id, updated_at desc)` index removed;
  - two duplicate `student_progress(student_email, lesson_id)` UNIQUE constraints removed, leaving one canonical UNIQUE constraint.
- RLS policy consolidation:
  - redundant `lesson_activities` SELECT policies collapsed without changing effective access;
  - equivalent permissive policies for lessons, questions, parent/student links, profiles and teacher-class relations were consolidated into the same logical OR conditions;
  - Supabase `multiple_permissive_policies` warning reduced from 13 to 0.
- RLS auth initialization optimized:
  - exact policies flagged by Supabase were rewritten to scalar-subquery auth calls, preserving predicate logic;
  - `auth_rls_initplan` warning reduced from 142 to 0.
- `get_student_dashboard_lessons(text, integer, integer)` changed to `SECURITY INVOKER` because it only reads published lessons joined to active public catalog tables already protected by RLS.
- Foreign-key indexing:
  - 39 covering FK indexes added for live learning, assessment, messaging, school, subscription, marketplace and teacher-course flows;
  - `unindexed_foreign_keys` reduced from 42 to 3;
  - the 3 intentionally remaining FKs belong to deferred AI Video / video-analysis paths and stay unindexed while that feature remains disabled.
- Current Supabase advisor posture after hardening:
  - no `multiple_permissive_policies` warning;
  - no `auth_rls_initplan` warning;
  - 3 INFO-level unindexed FKs intentionally deferred with AI Video;
  - `SECURITY DEFINER` warnings that remain are authenticated RPC/helper functions with explicit identity/role checks or RLS-helper requirements; do not convert them blindly.
  - leaked-password protection remains an external Supabase Auth setting (Dashboard Auth settings; Pro-plan feature) and is not changeable through the installed database connector.
- Production health remained healthy through the hardening sequence:
  - AI health: ok;
  - LiveKit: ok/configured;
  - Worker and Pages deployment sync continued normally.


## 2026-10-04 — Final production hygiene, live attendance, marketplace QA isolation, and BPay commission accounting

- Live attendance production defect fixed:
  - PostgreSQL logs showed repeated `23514` failures on `edu_live_attendance_role_check`.
  - `edu_can_join_live_session()` explicitly permits the school owner to join school-scoped sessions, but attendance accepted only `teacher/student/assistant`.
  - Migration `20261004234500_allow_school_live_attendance_role.sql` added the already-authorized `school` role to the attendance constraint.
  - Recent Edge/Auth log review showed no current 5xx; remaining diagnostic SQL errors were from maintenance queries, not application traffic.
- Marketplace SEO / QA fixture isolation:
  - public marketplace listing and sitemap exclude all course slugs beginning `e2e-`;
  - direct E2E course pages are `noindex,nofollow` and only accessible to explicit QA accounts matching `dadyoom.e2e.*@example.com`;
  - ordinary users cannot open those fixture details;
  - release-gate BPay and marketplace UI coverage remains testable.
- Release-gate cleanup hardened:
  - stale QA courses are cleaned in dependency-safe order;
  - stale email-keyed learning rows, `quiz_attempts`, orphaned `profiles`, and Auth test users are cleaned before creating a new QA fixture set;
  - current-run profiles are explicitly removed before Auth test-user deletion;
  - one-time cleanup migration `20261004235900_cleanup_stale_e2e_fixtures.sql` removed the historical backlog.
  - verification after cleanup: Auth E2E users=0, E2E profiles=0, E2E marketplace courses=0, E2E payment orders=0.
- Marketplace public copy corrected:
  - the old message claiming that course purchasing/payment was stopped was removed;
  - the marketplace now accurately states that published courses can be purchased through BPay when the teacher has configured receiving details, with access opened after transfer confirmation.
- BPay 15% commission accounting corrected:
  - BPay currently transfers the buyer's full course amount directly to the teacher, so the previous `platform_fee` field alone did not mean the platform had physically collected the fee.
  - Added `edu_platform_fee_receivables` with an auditable `due/settled/waived/reversed` lifecycle.
  - `finalizePaymentOrder()` now creates/upserts a `due` receivable for the 15% platform fee on completed BPay course purchases.
  - Release Gate now requires the 15% receivable row to exist with the expected amount and payment-order linkage.
  - This records the platform's economic receivable truthfully; automatic collection still requires a platform-owned collection channel to be configured later.
- Foreign-key advisor posture restored after the new receivable table:
  - course relation indexed via `20261004235930_index_platform_fee_course.sql`;
  - only the three intentionally deferred AI Video / video-analysis FK indexes remain unindexed.
- Production checks during closure:
  - AI health: `ok=true`;
  - LiveKit: `ok=true`, configured;
  - Google provider: enabled/configured;
  - marketplace public copy reflects live BPay flow;
  - 22 countries retain 12/12 published grade coverage; secondary G10-G12 remains >=19 published lessons per country, with MR/TN G13 present.


## 2026-10-04 — Sudan G12 official grammar enrichment

- Official Sudan source: `https://mdl.edu.sd/img/bookpdf/nahw3_1678863142.pdf`
  - Ministry of General Education / National Centre for Curricula and Educational Research.
  - Book: `قواعد اللغة العربية — الصف الثالث الثانوي`.
- Added only the clearly readable official TOC portion; ambiguous/corrupted TOC rows were intentionally omitted.
- Detailed catalog: `data/national-catalogs/sd-g12-arabic-grammar-detailed-verified-partial-2026.json`.
- Production migration: `20261004235945_enrich_sudan_g12_official_grammar.sql`.
- Verified detailed result:
  - 4 units;
  - 21 official topics/lessons;
  - 63 original Dadyoom questions;
  - 63 original Dadyoom activities.
- Verified units currently loaded:
  - الجمل وأشباه الجمل التي لها محل من الإعراب;
  - أسلوب الشرط;
  - النسب;
  - الجامد والمشتق.
- Sudan G11 remains at official bundle level because no current government-hosted detailed TOC was found; third-party lists were not promoted to official platform data.


## 2026-10-04 — Oman G12 Al-Mu'nis Semester 2 detailed official enrichment

- Official current digital-library source:
  - `https://ict.moe.gov.om/eBooks/index.php`
  - Book: `المؤنس — الصف الثاني عشر — الفصل الدراسي الثاني`
  - TOC page: `https://ict.moe.gov.om/book/PDF/12/cls12_Muunis_P2/files/basic-html/page12.html`
  - Direct official book URL: `https://ict.moe.gov.om/book/PDF/12/cls12_Muunis_P2/files/downloads/cls12_Muunis_P2.pdf`
- The book introduction explicitly states that enrichment texts are not part of the official syllabus; Dadyoom therefore excluded all enrichment texts from the official lesson count.
- Added detailed catalog: `data/national-catalogs/om-g12-muunis-s2-detailed-2026-2027.json`.
- Updated Oman G12 mapping and national structure metadata.
- Migration: `20261005000500_enrich_oman_g12_muunis_s2.sql`.
- Verified production result:
  - 7 official units;
  - 25 official scheduled topics/lessons;
  - 75 original Dadyoom questions;
  - 75 original Dadyoom activities.
- Representative official lessons now exposed by production API include:
  - قضية الشعر الجديد;
  - أنشودة المطر;
  - قصيدة حب إلى مطرح;
  - الأدب المسرحي;
  - كم لبثنا في الكهف؟;
  - أدب السيرة الذاتية;
  - عهد الطفولة;
  - مغامر عُماني في أدغال إفريقيا;
  - القصة;
  - اليوم الجديد;
  - زمن الفقر;
  - حوار الترجمة الأدبية ومشكلاتها;
  - الصحراء العربية;
  - حوار الشعوب;
  - الشباب ووقت الفراغ;
  - السينما والأدب;
  - كيف تكتب بحثًا;
  - الحوار الصحفي;
  - كتابة القصة;
  - الاستدلال;
  - التخطيط;
  - محاضر الاجتماعات;
  - البرهنة (رهانات المستقبل).
- Public course catalog now automatically hides the older six-node Oman G12 generic official bundle because the detailed official curriculum exceeds the detailed-coverage threshold; Dadyoom Core remains separate.


## 2026-10-04 — Yemen secondary official Arabic book-node refinement

- Official Yemen e-learning catalog confirms curriculum PDFs from primary through Grade 12.
- Direct Ministry-domain Arabic book files were resolved and stored instead of relying only on slow grade landing pages.
- Grade 10:
  - 6 published official book/part nodes;
  - 18 original Dadyoom questions;
  - 18 original Dadyoom activities.
  - Verified nodes:
    - الأدب والنصوص والبلاغة — الجزء الأول;
    - الأدب والنصوص والبلاغة — الجزء الثاني;
    - القراءة — الجزء الأول;
    - القراءة — الجزء الثاني;
    - النحو والصرف — الجزء الأول;
    - النحو والصرف — الجزء الثاني.
- Grade 11:
  - 5 published official book/part nodes;
  - 15 original Dadyoom questions;
  - 15 original Dadyoom activities.
  - Verified nodes:
    - الأدب والنصوص والبلاغة — الجزء الأول;
    - الأدب والنصوص والبلاغة — الجزء الثاني;
    - القراءة — الجزء الأول;
    - القراءة — الجزء الثاني;
    - النحو والصرف — الجزء الأول.
  - A second G11 grammar-part URL was not added because the indexed external listing duplicated the part-1 URL; no guess was made.
- Grade 12:
  - 3 published official book nodes;
  - 9 original Dadyoom questions;
  - 9 original Dadyoom activities.
  - Direct official files now attached:
    - الأدب والنصوص والبلاغة;
    - القراءة;
    - النحو والصرف.
- Catch-all Yemen secondary bundle placeholders were switched to `draft` so they are not counted as separate official books.
- Old superseded generic activities were removed after the refined book nodes were added.
- Internal textbook lesson titles remain unexpanded until a readable official TOC is available.


## 2026-10-04 — Secondary source-depth follow-up: Morocco, Tunisia, Syria, Somalia, Comoros

### Morocco
- Official Ministry TelmidTice now provides strong digital-course coverage evidence:
  - Grade 10 / جذع مشترك أدبي / اللغة العربية: 45 lessons across 17 weeks.
  - Grade 12 / السنة الثانية باكالوريا آداب / اللغة العربية وآدابها: 49 lessons across 17 weeks.
- These official counts and exact TelmidTice listing URLs are recorded in the mapping/catalog metadata.
- The counts were NOT converted into Dadyoom lesson nodes because the dynamic official interface did not expose a stable auditable list of lesson titles through the available non-interactive retrieval path.

### Tunisia
- Fixed stale mapping metadata that still reported one official lesson per secondary grade while production already contained the verified CNP textbook nodes.
- GitHub mappings now match the official CNP book structure and production DB:
  - G10: 2 official Arabic books;
  - G11: 3 official Arabic books;
  - G12: 3 official Arabic books;
  - G13: 4 official Arabic books.
- Verified titles/codes remain sourced from CNP grade lists (e.g. آفاق أدبية، عيون الأدب، علامات، رؤى, and the Arts/Sport variants).
- Added migration `20261005013000_link_tunisia_secondary_official_book_sources.sql`.
- All 12 published Tunisia secondary official book nodes now have the exact CNP grade-list source URL attached.

### Syria
- Current Ministry portal confirms the 2026 textbook production/distribution program, including a plan for 41 million school books.
- No current Ministry-hosted public secondary Arabic textbook file or auditable Arabic TOC was found.
- No third-party lesson list was promoted to official Dadyoom data.

### Somalia
- Federal Ministry sources confirm the unified Grade 9-12 secondary structure, national curriculum harmonization, and Arabic as a secondary textbook/subject.
- No current grade-by-grade official Arabic textbook catalog or TOC was publicly exposed.
- Coverage remains at national bundle level; no titles were invented.

### Comoros
- Ministry sources confirm Arabic-language teaching in lycées and active teacher-capacity work.
- No current Ministry-hosted grade-specific Arabic secondary textbook/program TOC was found.
- Coverage remains at official bundle level; no titles were invented.

### Iraq / Kuwait / Djibouti G11
- Iraq official curriculum portal remains blocked from public indexing of the Arabic secondary files.
- Kuwait official e-library exposes the textbook/standards library and filters but not a stable static result endpoint for secondary Arabic titles.
- Djibouti Première Arabic detailed programme remains unavailable publicly; only the official secondary-series structure is currently verifiable.
- These scopes remain intentionally unexpanded rather than guessed.


## 2026-10-04 — Lebanon 2026 curriculum-reform status

- CRDP officially confirms issuance of the new pre-university general-education curriculum by Decree No. 3445 dated 15 July 2026.
- CRDP also states that the next implementation stage includes:
  - preparation of guides and standards;
  - training plans;
  - pilot implementation;
  - gradual rollout;
  - monitoring and evaluation.
- The current public Arabic curriculum page remains useful for the official secondary track/hour structure:
  - First secondary: 2 weekly / 60 annual;
  - Second secondary humanities: 2 / 60;
  - Second secondary sciences: 4 / 120;
  - Third secondary Arts & Humanities: 6 / 180;
  - Third secondary Sociology & Economics: 3 / 90;
  - Third secondary General Sciences: 6 / 180;
  - Third secondary Life Sciences: 5 / 150.
- The latest publicly exposed year-specific reduced curriculum remains 2025-2026; it is now explicitly marked as historical/year-specific evidence and is NOT treated as the 2026-2027 implementation plan.
- No current public 2026-2027 secondary Arabic topic/lesson list was found after the 2026 reform decree.
- Lebanon G10/G11/G12 therefore remain at the verified domain/track level; no new lesson titles were fabricated.
- Updated all Lebanon 2026-2027 mapping JSONs and the national catalog with Decree 3445 and rollout status.

## 2026-10-04 — live deployment + Kuwait/Sudan secondary verification follow-up

- Live deployment re-verified against branch HEAD `05cf2cf46225b2a27d2fcc3bc7a3e8bd4ffed4a8`: Worker, Pages, and `dadyoom.dpdns.org` all reported the same commit/build metadata before this metadata-only source correction.
- Production health at that checkpoint: AI `ok=true`; LiveKit `ok=true, configured=true`; Google provider enabled/configured. Supabase project remained `ACTIVE_HEALTHY`; recent error scan returned no 5xx/error rows in the checked window.
- Kuwait G10: refreshed the 2026/2027 official status from Ministry news 1343/1344. «مسارات» is in active limited rollout in 12 schools; 2991 learners started on 15-09-2026. The foundation/exploration stage includes Arabic as a shared course and path selection begins after 18 units. G10 remains course-semester bundle-level because no auditable public secondary Arabic lesson sequence was exposed. G11/G12 were not reclassified as Masarat cohorts without separate evidence.
- Sudan G11: the official national digital library now directly exposes the book «النحو — ثاني ثانوي». The G11 mapping was corrected to reference that G11 book instead of using the G12 grammar PDF as supporting evidence.
- Sudan G11 detailed expansion remains intentionally blocked: the official PDF text layer is unreadable/garbled for trustworthy TOC extraction, so no lesson title was inferred and no DB migration/count change was made.
- Oman G10/G11 were rechecked against official Ministry book/library evidence, but no stable government-hosted auditable TOC was exposed in the available static source path; they remain bundle/book-level rather than importing third-party lesson lists.

## 2026-10-04 — Djibouti Première / G11 official detailed Arabic

- Unblocked G11 using CRIPEN's official `Programme-compile-1ere.pdf`; the official PDF table of contents places Arabic in the Première programme, and the Arabic section explicitly covers the second-secondary programme.
- Added `data/national-catalogs/dj-g11-arabic-detailed-verified-partial-2026.json` with 15 official units/domains and 60 clearly readable official topics.
- One environmental slot remains intentionally unresolved because the RTL text layer was garbled and the PDF screenshot endpoint did not provide a reliable visual confirmation; no memory-based correction was used.
- Updated G11 mapping from four generic series nodes to the detailed Première programme: 60 official / 60 mapped / 60 verified topics.
- Applied Supabase migration `20261004204737_enrich_djibouti_g11_official_arabic.sql` successfully.
- Post-migration verification: 15 units / 60 lessons / 180 original Dadyoom questions / 180 original Dadyoom activities.
- The old generic G11 series bundle remains in DB for provenance/backward compatibility; course-catalog cleanup can hide it because detailed coverage now exceeds the >=10 threshold.
- This supersedes the earlier note in this file that Djibouti G11 detailed programme was unavailable.

## 2026-10-05 — canonical completion/BPay hardening + Oman G10/G11 current books

### Production Role QA hardening
- Role QA on commit `94b628ab46ae23c2f3e7f633a8ca3eb2fc62c8a4` exposed a real `E2E_CANONICAL_COMPLETION_FAILED:500` after the lesson activity flow had otherwise passed.
- Commit `57820eead0bc180f9a505872b047e429953b6fe5` hardened canonical completion:
  - removed the redundant mastery re-fetch/re-grading path;
  - writes the already-calculated mastery result directly and remains fail-closed before durable completion;
  - post-completion streak/adaptive/profile/cache integrations now run as best-effort side effects and cannot turn an already-committed lesson completion into HTTP 500;
  - post-completion XP snapshot no longer performs redundant readbacks.
- The next Production Role QA run confirmed the lesson fix: `E2E_LESSON_COMPLETION_MASTERY=PASS`, `E2E_ASSESSMENT_SESSION=PASS`, `E2E_NEXT_LESSON=PASS`, and `E2E_CANONICAL_LEARNING_FLOW=PASS`.
- That run then exposed a later independent BPay submit 500. Supabase logs proved checkout/order creation and duplicate-reference probing succeeded, but no PATCH reached PostgREST.
- Commit `643edb4f980bf3e69d00c39c1d475f024ba9387e` made BPay reference submission atomic:
  - removed the read-before-write duplicate probe;
  - relies on the existing unique `edu_payment_orders.bank_reference` constraint;
  - maps PostgreSQL `23505` to the intended 409 duplicate-reference response;
  - adds explicit error observability and idempotent approved-state handling.
- Cloudflare Verify, Cloudflare Deploy, and Mobile Final Verify passed for the BPay-fix commit. Production Role QA for that commit was still executing at the last status poll and must be checked before declaring the full role gate green.

### Oman G10/G11 — current 2026/2027 official textbooks
- The Ministry's 2026/2027 editions guide superseded the older generic six-skill secondary placeholders for these grades.
- Grade 10 current official Arabic books:
  - «لغتي الجميلة — الفصل الدراسي الأول»;
  - «لغتي الجميلة — الفصل الدراسي الثاني».
  - Official editions-guide evidence: `https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page38.html`.
  - Direct Ministry flipbooks were also verified for both semesters.
- Grade 11 current official Arabic books:
  - «المؤنس — الفصل الدراسي الأول»;
  - «المؤنس — الفصل الدراسي الثاني»;
  - «المفيد».
  - Official editions-guide evidence: `https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page41.html`.
- Applied Supabase migrations:
  - `20261005125831_refine_oman_g10_g11_official_arabic_books_v2.sql`;
  - `20261005125859_cleanup_oman_g10_g11_superseded_activities.sql`.
- Production DB/API verification:
  - G10 official match = 2 published book nodes, each with 3 questions and 3 published activities;
  - G11 official match = 3 published book nodes, each with 3 questions and 3 published activities;
  - superseded generic skill bundles remain stored as draft for provenance;
  - Dadyoom Core remains separate at 18 published support lessons per grade.
- No 2025/2026 internal lesson title was promoted as a 2026/2027 title. The current 2026/2027 Arabic orientation bulletin is scanned-image based; detailed internal expansion remains blocked until its tables can be read from an auditable current source.



## 2026-10-05 — final production gate

- Final production gate: SUCCESS on HEAD f0bf062e1174f6a45adde332833d5ad5f85d94b8.
- Production Role QA run 37313734071: success.
- Cloudflare Deploy run 37313734132: success.
- Cloudflare Verify run 37313734082: success.
- Mobile Final Verify run 37313734097: success.
- Canonical lesson completion and BPay submit regressions are closed on the production-gated branch.
