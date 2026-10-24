// Read-only repository source inventory. No API keys, student records, or DB calls.
// Static .from("table") and .rpc("function") detection is intentionally
// conservative: indirect dynamic identifiers and SQL are NOT covered.
// Review all rows and re-check authenticated/RLS behavior before release.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const roots = ["app", "components", "features", "hooks", "lib", "services", "importer"];
const tables = new Set([
  "questions", "lesson_activities", "ai_assessments",
  "question_attempts", "lesson_activity_attempts",
  "student_lesson_progress", "lesson_mastery",
  "assessment_sessions", "assessment_session_answers"
]);
const rpcs = new Set([
  "get_lesson_page_bundle",
  "move_lesson_question_safe",
  "delete_lesson_question_safe"
]);
const excluded = new Set(["node_modules", ".next", ".cloudflare", "dist", ".git"]);
const rows = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a,b) =>
    a.name.localeCompare(b.name))) {
    if (excluded.has(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(file);
    } else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) {
      const content = readFileSync(file, "utf8");
      const path = relative(process.cwd(),file).replaceAll("\\", "/");
      const kind = /^\s*["']use client["']\s*;/m.test(content.slice(0,256))
        ? "client-module" : path.startsWith("app/api/") ||
          /import\s*["']server-only["']/.test(content) ||
          /^\s*["']use server["']\s*;/m.test(content.slice(0,256))
          ? "server-marked" : "requires-context-review";
      const calls = /\.(from|rpc)\s*\(\s*["']([a-zA-Z][a-zA-Z0-9_]*)["']/g;
      for (const hit of content.matchAll(calls)) {
        const call = hit[1], name = hit[2];
        if (!(call === "from" ? tables : rpcs).has(name)) continue;
        const line = content.slice(0,hit.index).split("\n").length;
        rows.push({ path, line, call, name, moduleClassification: kind });
      }
    }
  }
}
for (const root of roots) walk(resolve(root));
rows.sort((a,b) => a.path.localeCompare(b.path) || a.line-b.line);
if (!rows.length) throw new Error("ASSESSMENT_CONSUMER_SCAN_EMPTY");
const counts = Object.fromEntries(
  [...new Set(rows.map(r => r.call + ":" + r.name))].sort()
    .map(key => [key, rows.filter(r => r.call + ":" + r.name === key).length])
);
const report = {
  scope: "Static direct-call matches in application roots only; not a security certification",
  sourceRoots: roots,
  consumers: rows,
  counts
};
writeFileSync(resolve("assessment-consumers-ci.json"),JSON.stringify(report,null,2)+"\n");
console.log("ASSESSMENT_CONSUMERS_INDEXED="+rows.length);
console.log("ASSESSMENT_CONSUMERS_CLIENT_MARKED="+rows.filter(r=>r.moduleClassification==="client-module").length);
for (const [key,count] of Object.entries(counts)) {
  console.log("ASSESSMENT_CONSUMER_COUNT "+key+"="+count);
}
