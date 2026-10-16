import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const gate=readFileSync(".github/workflows/seo-production-gate.yml","utf8");
const sample=gate.slice(gate.indexOf("check_indexable_url() {"),gate.indexOf('      - name: Verify one indexable lesson metadata'));

describe("Indexable lesson SEO gate retries transient 200 HTML lacking canonical",()=>{
 test("requires actual canonical and exact indexed URL even if edge returns 200",()=>{
   expect(sample).toContain('if [[ "$code" == "200" ]]; then');
   expect(sample).toContain("if grep -Fq 'rel=\"canonical\"'");
   expect(sample).toContain('grep -Fq "href=\\"$url\\"" "$html"');
   expect(sample).toContain("SEO_DISTRIBUTED=RETRY_MISSING_CANONICAL");
   expect(sample).toContain("continue");
   expect(sample).toContain("SEO_DISTRIBUTED=FAIL_CANONICAL");
 });
 test("continues to fail persistent edge errors and missing robots/title/description",()=>{
   expect(sample).toContain('if [[ "$code" != "200" ]]; then');
   expect(sample).toContain("SEO_DISTRIBUTED=FAIL_HTTP");
   expect(sample).toContain("SEO_DISTRIBUTED=FAIL_TITLE");
   expect(sample).toContain("SEO_DISTRIBUTED=FAIL_DESCRIPTION");
   expect(sample).toContain("SEO_DISTRIBUTED=FAIL_NOINDEX");
   expect(sample).toContain("SEO_DISTRIBUTED=FAIL_LEGACY_HOST");
 });
});
