# Bahrain independent textbook TOC signoff — evidence contract

Do **not** set `COMPLETE_BOOK` from published lesson counts, teaching plans, or the ministry's *list of book names*. These are distinct sources. Every grade/semester/track scope must have its **own verified textbook edition(s)** and a 1:1 item-to-published-lesson review.

The `independentTocEvidence` object is **absent until real verification**. Its minimum fields, per scope, are:
- `academicYear: "2026-2027"`, `scopeBookTitlesVerified: true`, `scopeBookTitles: [actual edition titles within this term]`, `reviewedBy`, `reviewedAt`;
- `books[]`: one entry for each confirmed in-scope edition, with `title`, `editionYear`, `tocSourceUrl` pointing to the **book**, not `Plan1.pdf` or the book-name guide, a verified immutable `sourceSha256`, `reviewedBy`, `reviewedAt`;
- `books[].items[]`: every independently extracted **book** TOC item, containing stable `tocKey`, `title`, positive integer `page`, `matchedLessonId` (live UUID), `matchedLessonTitle`, `matchReviewedBy`, `matchReviewedAt`.
- `bookTotalTOCItems` is the sum of ALL actual TOC items, `matchedTOCItems` the distinct verified mappings, `missingItems` their difference. Raw `importedItems` is only the number of imported lessons; it does **not** measure textbook parity.

Requirements: no duplicate editions, no duplicate TOC keys in an edition, no lesson ID reused for two different entries, and no unreviewed mappings. The validator also refuses out-of-year editions, book guides and teaching plans being used as a stand-in for a textbook TOC.

The validator is a **structural consistency gate**; it cannot prove a cited book page or a teacher signature is authentic by itself. The reviewer still must inspect and sign the original current-year book and the actual live lesson text, activities and source. All 56 original scopes currently remain **not certified**. No student records or draft question status are changed by these checks.

Commands:
```sh
node scripts/audit-bahrain-book-completeness.mjs
node scripts/verify-dadyoom-completion.mjs
node scripts/verify-dadyoom-completion.mjs --strict
```
