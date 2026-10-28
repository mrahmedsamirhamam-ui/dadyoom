# Dadyoom Arabic curricula: 22 countries × Grades 1–3, 2026–27

This is an **evidence-only live database baseline**, produced by `scripts/arab-22-grades-1-3-readonly-audit.sql` on 2026-10-27. It contains **66 country × grade rows**; see `data/curriculum-audits/arab-22-grades-1-3-baseline-2026-10-27.json`.

## Critical finding

Every country/grade already exposes 18 authored Dadyoom generic thematic skill-pack lessons (1,188 across the 66 rows), even if that country's official textbook TOC has never been compared. **Publishing a generic exercise must not count toward ministry-prescribed title coverage.** Question presence does not imply aligned or valid answers. The three grades contain 7,541 question rows but only 494 / 329 / 264 different prompt strings per grade (many reusable exercises across countries); 14 / 9 / 13 prompts under 18 characters require review. Stored answer keys were not accessed, tested or exported.

## Official evidence and limits

- Bahrain: `https://www.edunet.bh/Econtent/LessonsGuide` — official Arabic basic education first-term 2026–27 plans. A current year planning listing is not an exhaustive two-term TOC mapping.
- Jordan: `https://nccd.gov.jo/Ar/Pages/Publications/?MaterialStudy=92` — official Arabic student/exercise book directory, both terms for grades 1–3. Book PDF edition, TOC and exact lesson title matching still pending.
- Saudi Arabia: `https://madrasatibeta.moe.gov.sa/books?Language=2` — official primary textbooks catalog; 2026–27 book edition and lesson titles not independently mapped.
- UAE: `https://www.moe.gov.ae/ar/guides/Pages/Study-Plan-for-the-2026-2027-Academic-Year-Ministry-Curriculum.aspx` — 2026–27 overall study plan; no Arabic primary lesson TOCs verified.
- Qatar: `https://edu.gov.qa/ar/Content/EarlyLearning` — grades 1–2 foundation teaching and assessment policy; not textbooks.
- Oman: `https://home.moe.gov.om/ar/manaheg` — official library categories for early grades; exact 2026–27 edition and grade-three index unverified.
- Egypt: `https://studentbooks.moe.gov.eg/Books` — official book portal, content not independently rendered.
- Lebanon: `https://www.crdp.org/curriculum/` — 2026–27 CRDP official competencies release; a new national curriculum was announced 2026-10-26. No individual textbook TOCs reconciled, and no assumption about when implementation of the new curriculum starts.
- Algeria: `https://www.education.gov.dz/2026/07/30/` — 2026–27 teaching arrangements; not an Arabic book TOC.

Other countries remain **official TOC not verified**, not 'no official curriculum exists'. Follow grade order **Grade 1 across all 22**, then Grade 2, then Grade 3. For every country/term source collect exact issuing authority, URL, school year, grade, stream, textbook edition, PDF TOC page, normalized exact chapter/lesson headings, lesson IDs in our database, question/answer review, rights, and human sign-off. Record each as `verified-ministry-title`, `original-supplement`, `missing-verified-title`, or `unverified-mapping`. Add missing titles only when the source and original pedagogical content are verified; do not auto-import protected textbook paragraphs.

## Release gate

None of the 66 country × grade rows has been verified as complete. No migration, server-assessed grading changes, PR merge, or Cloudflare production deployment occurred as part of this audit. Current Production #57 assessment-answer/grading permissions and #46 Cloudflare external build still require independent checks. Test via `npx vitest run tests/arab-22-grades-1-3-baseline.test.ts`.

## Exact-title reconciliation gate

Actual public lesson titles and UUIDs for all three grades are now indexed in grade-specific JSON under `data/curriculum-audits/arab-22-grade-{1,2,3}-lesson-review-2026-10-27.json` (total 1,746 records). They contain no student data or question answer keys. After verifying a current **official edition and source TOC pages**, use `node scripts/compare-official-arabic-toc.mjs --catalog=PATH.json --toc=MANUALLY_VERIFIED_OFFICIAL_TOC.json` to compare titles. The official TOC must state country, grade, semester, 2026–2027 school year, official issuer, edition, evidence URL, verified flags and each TOC page. Missing titles are flagged, existing titles require content/question review, untimed lessons remain unverified, and the 1,188 common skills are never counted as ministry-required titles. No import, redistribution of ministry book texts or production writes.

## Second source discovery batch (2026-10-27)

- Tunisia, National Pedagogical Center: https://www.cnp.com.tn/ lists **2026–27 books**, without a reviewed Arabic grade-by-grade TOC.
- Palestine, Ministry of Education: https://moe.edu.ps/pal-books explicitly lists **لغتنا الجميلة** for Grades 1–3, both semesters, though exact book editions and title pages were not checked (a large linked PDF could not be inspected here).
- Libya, official educational curriculum center: https://cerc.moe.gov.ly/educational-curricul/?_educational-stage=education-basic lists Grades 1 and 2 Arabic with **2025–26**, so these cannot establish 2026–27 lesson coverage.
- Morocco, Ministry of Education: https://www.men.gov.ma/ points to TelmidTice. Grade-2 Arabic digital lessons are catalogued, but that is not the government textbook TOC.
- Iraq, reported new first-grade **قراءتي** Unit 1 for 2026–27 at https://manahj.edu.iq/index.php?name=Pages&op=page&pid=164 (2026-10-09); only a secondary news report could be read; first-party page was inaccessible, so **not independently certified**. This needs special attention before reusing old Grade-1 Arabic chapter titles.

No new evidence status certifies lesson-title equivalence. All 66 country-grade cases remain under official-TOC and pedagogy review. Other countries' searches found no sufficiently grounded lesson-level primary documents in this audit round; this is a retrieval gap, not evidence that the curricula do not exist.
