import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function pages(dir, rel = "") {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(rel, entry.name);
    if (entry.isDirectory()) {
      if (["admin", "api"].includes(entry.name)) return [];
      return pages(path.join(dir, entry.name), relative);
    }
    return entry.name === "page.tsx" || entry.name === "page.jsx"
      ? [relative] : [];
  });
}
test("new review approval badge cannot render on ANY visitor page source", () => {
  const files = pages(path.join(root, "app"));
  assert.ok(files.length > 0, "Must scan real public route sources; no vacuous pass.");
  for (const file of files) {
    const source = fs.readFileSync(path.join(root,"app",file), "utf8");
    assert.doesNotMatch(source, /shouldDisplayPublicReviewBadge|PUBLIC_REVIEW_BADGE_ENABLED|dadyoom-reviewed-badge|روجع واعتُمد/u, file);
  }
  const model = fs.readFileSync(path.join(root,"lib/lesson-review/model.ts"), "utf8");
  assert.match(model,/PUBLIC_REVIEW_BADGE_ENABLED\s*=\s*false\s+as\s+const/);
  console.log("PUBLIC_PAGES_SCANNED=" + files.length);
});
