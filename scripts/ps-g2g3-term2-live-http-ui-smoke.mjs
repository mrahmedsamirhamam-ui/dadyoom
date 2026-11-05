#!/usr/bin/env node
/**
 * Read-only production smoke for the 14 Palestine G2/G3 semester-two lessons.
 * Tests public HTTP responses and server-rendered HTML, not logged-in flows.
 * Does NOT certify the 2026-2027 ministerial textbook edition or make DB writes.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";

const source = "data/ministerial-audit/2026-11-05-ps-g2g3-term2-2020-2024-2026-source-crosscheck.json";
const reportPath = process.env.DADYOOM_LIVE_SMOKE_REPORT || join(process.cwd(), "reports", "ps-g2g3-term2-live-smoke.json");
const baseUrl = "https://dadyoom.com";
const doc = JSON.parse(await readFile(source, "utf8"));
const lessons = doc.lessons_from_2020_additions;
const failedValidation = (message) => { throw new Error("Unsafe/incomplete smoke fixture: " + message); };
if (!Array.isArray(lessons) || lessons.length !== 14) failedValidation("Expected 14 lessons");
if (lessons.filter(item => item.grade === 2).length !== 7 || lessons.filter(item => item.grade === 3).length !== 7)
  failedValidation("Expected 7 Grade-2 and 7 Grade-3 lessons");
const idRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const titleSet = new Set();
for (const l of lessons) {
  if (!idRe.test(l.id) || typeof l.title !== "string" || !l.title.trim()) failedValidation("Invalid ID or title");
  if (titleSet.has(l.grade + "|" + l.title)) failedValidation("Duplicate title/grade");
  if (l.lesson_url !== baseUrl + "/lessons/" + l.id) failedValidation("Unexpected URL");
  titleSet.add(l.grade + "|" + l.title);
}
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
async function probe(lesson) {
  const url = baseUrl + "/lessons/" + lesson.id;
  const result = { grade: lesson.grade, title: lesson.title, id: lesson.id, url, status: null, checked: false, errors: [], elapsed_ms: null };
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "Accept": "text/html", "Accept-Language": "ar", "User-Agent": "Dadyoom-Curriculum-Smoke/1.0 (+GitHub Actions; read-only)" },
      signal: AbortSignal.timeout(20000)
    });
    result.status = response.status;
    result.final_url = response.url;
    result.content_type = response.headers.get("content-type");
    if (response.status !== 200) result.errors.push("HTTP_STATUS_NOT_200");
    if (response.url !== url) result.errors.push("REDIRECTED_UNEXPECTEDLY");
    if (!response.headers.get("content-type")?.includes("text/html")) result.errors.push("NOT_HTML");
    const html = await response.text();
    result.html_bytes = Buffer.byteLength(html, "utf8");
    const hasHeading = new RegExp("<h1\\b[^>]*>[\\s\\S]*?" + escapeRegex(lesson.title) + "[\\s\\S]*?<\\/h1>", "u").test(html);
    if (!hasHeading) result.errors.push("MISSING_EXPECTED_H1");
    if (!html.includes("أهداف التعلم")) result.errors.push("MISSING_LEARNING_OBJECTIVES");
    if (!html.includes("شرح الدرس")) result.errors.push("MISSING_LESSON_EXPLANATION");
    if (!html.includes("2026–2027")) result.errors.push("MISSING_EDITION_CAVEAT");
  } catch (e) {
    result.errors.push("REQUEST_ERROR:" + String(e?.name || "Error"));
  }
  result.elapsed_ms = Date.now() - started;
  result.checked = result.errors.length === 0;
  console.log((result.checked ? "PASS" : "FAIL") + " " + lesson.grade + " " + lesson.title + " " + String(result.status) + " " + result.errors.join(","));
  return result;
}
const results = [];
for (let offset = 0; offset < lessons.length; offset += 3) {
  results.push(...await Promise.all(lessons.slice(offset, offset + 3).map(probe)));
}
const summary = {
  checked_at: new Date().toISOString(), source, live_origin: baseUrl,
  disclaimer: "Public GET + SSR HTML only. No login, interactive navigation, authority approval, full-2026-27 syllabus or student progress testing.",
  total: results.length,
  passed: results.filter(r => r.checked).length,
  failed: results.filter(r => !r.checked).length,
  results
};
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ total: summary.total, passed: summary.passed, failed: summary.failed, reportPath }));
if (summary.failed) process.exitCode = 1;
