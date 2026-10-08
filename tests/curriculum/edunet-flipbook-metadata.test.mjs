import { test, expect } from "vitest";

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
  expect(parsed.fliphtml5_pages.length).toBe(3);
});

test("does not mistake page count for verified lessons", () => {
  const result = extractBookMetadata(fixture, viewer);
  expect(result.viewerPageCount).toBe(3);
  expect(result.tocEntryCount).toBeNull();
  expect(result.tocVerified).toBe(false);
  expect(result.status).toBe("PENDING_HUMAN_TOC_MATCH");
  expect(result.pdfUrl).toMatch(/Arabic%204th%20T%20P2-17_6_2025\.pdf$/);
});

test("rejects off-domain and insecure sources", () => {
  expect(() => officialUrl("https://example.org/book")).toThrow(/UNTRUSTED_/);
  expect(() => officialUrl("http://www.edunet.bh/book")).toThrow(/UNTRUSTED_/);
  const bad = "var htmlConfig = " + JSON.stringify({
    ...baseConfig,
    downloadconfig:{pdf:{url:"https://evil.example/capture.pdf"}}
  });
  expect(() => extractBookMetadata(bad, viewer)).toThrow(/UNTRUSTED_/);
});

test("rejects absent, truncated and empty flipbook configurations", () => {
  expect(() => parseHtmlConfig("var somethingElse = {}")).toThrow(/NOT_FOUND/);
  expect(() => parseHtmlConfig('var htmlConfig = {"fliphtml5_pages":[]};')).toThrow(/PAGE_LIST_MISSING/);
  expect(() => parseHtmlConfig('var htmlConfig = {"fliphtml5_pages":[{}]')).toThrow(/UNTERMINATED/);
});
