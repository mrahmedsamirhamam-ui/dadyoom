# Bahrain Arabic Unified Secondary — 2026–2027

These files preserve the **verified official structure** for Bahrain Arabic unified secondary and now also contain **original Dadyoom instructional content**.

- Grade 10 canonical lessons: 14
- Grade 11 canonical lessons: 22
- Grade 12 canonical lessons: 19
- Canonical secondary total: 55
- Official structure source: https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan2.pdf
- Lesson explanations, objectives, vocabulary and question banks: original Dadyoom content.

The literary works named by the official plan are **not republished** in these packs. Dadyoom teaches analysis and language skills and directs learners to the official textbook or another licensed copy for the assigned text.

The historical backup contained 24 / 35 / 36 flattened extraction rows (95 total). Those rows included headings, continuation fragments, split table-cell text and instructions; they were not 95 standalone lessons.

The 55 canonical lessons were verified against Plan2 and the existing structured Supabase lesson records.

## Import status

The three packs are now `importReady: true`.

The generic importer supports `curriculum.storageNameAr`, so Grades 10–12 target the existing shared Bahrain curriculum `اللغة العربية` for academic year 2026–2027 instead of creating duplicate semester-specific curriculum rows. Lesson slugs also include the unit number, so packs with multiple units cannot collide on lesson-number-based slugs.

Dry run:

`node scripts/import-curriculum-pack.mjs --pack <pack-file>`

Apply only with verified Supabase service credentials:

`node scripts/import-curriculum-pack.mjs --pack <pack-file> --apply`
