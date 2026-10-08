import test from "node:test";
import assert from "node:assert/strict";

import {
  officialUrl,
  parseHtmlConfig,
  extractBookMetadata,
} from "../../scripts/extract-edunet-flipbook-metadata.mjs";

const viewer = "https://www.edunet.bh/e_content/level_1/stage_4/subject_ID_1/Part_2/e_books/Arabic-G4-P2-WB-2024/Arabic%20G4%20P2%20WB%202024/index.html";
const baseConfig = {
  fliphtml5_pages: [
    { l: "files/page/1.jpg", t: "files/thumb/1.jpg" },
    { l: "files/page/2.jpg", t: "files/thumb/2.jpg" },
    { l: "files/page/3.jpg", t: "files/thumb/3.jpg" },
  ],
  ols: [],
  bookConfig: 'escaped " phrase',
  downloadconfig: { pdf: { url: "files/Arabic 4th T P2-17_6_2025.pdf" } },
};
const fixture = "var htmlConfig = " + JSON.stringify(baseConfig) + ";";

test("reads config JSON without eval and handles escaped strings", () => {
  const parsed = parseHtmlConfig("<html><body>" + fixture + "</body></html>");
  assert.equal(parsed.fliphtml5_pages.length, 3);
});

test("does not mistake page count for verified lessons", () => {
  const result = extractBookMetadata(fixture, viewer);
  assert.equal(result.viewerPageCount, 3);
  assert.equal(result.tocEntryCount, null);
  assert.equal(result.tocVerified, false);
  assert.equal(result.status, "PENDING_HUMAN_TOC_MATCH");
  assert.match(result.pdfUrl, /Arabic%204th%20T%20P2-17_6_2025\.pdf$/);
});

test("rejects off-domain and insecure sources", () => {
  assert.throws(() => officialUrl("https://example.org/book"), /UNTRUSTED_/);
  assert.throws(() => officialUrl("http://www.edunet.bh/book"), /UNTRUSTED_/);
  const bad = "var htmlConfig = " + JSON.stringify({
    ...baseConfig,
    downloadconfig:{pdf:{url:"https://evil.example/capture.pdf"}}
  });
  assert.throws(() => extractBookMetadata(bad, viewer), /UNTRUSTED_/);
});

test("rejects absent, truncated and empty flipbook configurations", () => {
  assert.throws(() => parseHtmlConfig("var somethingElse = {}"), /NOT_FOUND/);
  assert.throws(() => parseHtmlConfig('var htmlConfig = {"fliphtml5_pages":[]};'), /PAGE_LIST_MISSING/);
  assert.throws(() => parseHtmlConfig('var htmlConfig = {"fliphtml5_pages":[{}]'), /UNTERMINATED/);
});
