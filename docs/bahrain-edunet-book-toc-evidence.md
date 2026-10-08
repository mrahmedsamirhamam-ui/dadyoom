# Bahrain official textbook TOC evidence

Official Edunet flipbook viewers may expose the number of viewer pages and the original PDF path in javascript/config.js. Neither proves that every lesson appears in Dadyoom.

Extract source metadata offline: node scripts/extract-edunet-flipbook-metadata.mjs --viewer-url URL --config-file downloaded-config.js
Extract source metadata online: node scripts/extract-edunet-flipbook-metadata.mjs --viewer-url URL --output book-metadata.json
Run parser tests: node --test tests/curriculum/edunet-flipbook-metadata.test.mjs

The script is read-only and never evaluates remote JavaScript. All source URLs must be HTTPS URLs on edunet.bh. If original PDFs are blocked or the extracted text is scrambled, retain PENDING_HUMAN_TOC_MATCH and DO NOT set COMPLETE_BOOK.

Only a legible, current-edition, individually verified official TOC plus mapped real lesson identifiers is valid completeness evidence.
