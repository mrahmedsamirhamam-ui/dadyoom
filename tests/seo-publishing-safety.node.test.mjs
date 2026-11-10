import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

test("sitemap enumerates ALL published lessons in pages and skips explicitly source-unready lessons", () => {
  const source = read("app/sitemap.ts");
  assert.match(source, /\.eq\("status",\s*"published"\)/);
  assert.match(source, /\.range\(offset,\s*offset\s*\+\s*pageSize\s*-\s*1\)/);
  assert.match(source, /needsSourcePublicationReview\(lesson\.instructions\)/);
  assert.match(source, /\$\{base\}\/lessons\/\$\{lesson\.id\}/);
});

test("unready published lessons remain noindex, while public pages retain canonical metadata", () => {
  const source = read("app/lessons/[id]/page.tsx");
  assert.match(source, /needsSourcePublicationReview\(data\.instructions\)/);
  assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  assert.match(source, /alternates:\s*\{\s*canonical:\s*`\/lessons\/\$\{id\}`\s*\}/);
  assert.match(source, /lessonStructuredData\s*\?\s*\(/);
  assert.match(source, /JSON\.stringify\(lessonStructuredData\)\.replace\(\/<\/g/);
});

test("robots and home organization schema stay connected", () => {
  const robots = read("app/robots.ts");
  const layout = read("app/layout.tsx");
  assert.match(robots, /sitemap:\s*`\$\{base\}\/sitemap\.xml`/);
  assert.match(robots, /"\/admin\/"/);
  assert.match(layout, /const websiteStructuredData/);
  assert.match(layout, /const organizationStructuredData/);
  assert.match(layout, /"@type": "EducationalOrganization"/);
});
