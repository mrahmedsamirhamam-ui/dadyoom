#!/usr/bin/env node
// Offline heuristic SEO audit. No network, no Supabase, and no production writes.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const clean = (value) => String(value ?? "").normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670\u0640]/gu, "")
  .replace(/\s+/gu, " ").trim().toLowerCase();
const sourceUnready = (instructions) => Array.isArray(instructions) && instructions.some(
  (value) => value && typeof value === "object" && !Array.isArray(value) &&
    value.kind === "dadyoom_source" && value.source_publication_ready === false
);

export function auditExportedLessonsSeo(rows) {
  if (!Array.isArray(rows)) throw new TypeError("EXPECTED_JSON_ARRAY_OF_LESSONS");
  const published = rows.filter((r) => r && r.status === "published");
  const clusters = new Map();
  const sourceUnreadyIds = [];
  const limitedTextCandidates = [];
  const officialClaimCandidates = [];
  const unscopedIds = [];
  for (const row of published) {
    const id = typeof row.id === "string" ? row.id : "UNKNOWN_ID";
    if (sourceUnready(row.instructions)) sourceUnreadyIds.push(id);
    const title = clean(row.title);
    const country = clean(row.country_code);
    const grade = Number(row.grade_number);
    if (title && country && Number.isInteger(grade) && grade > 0) {
      const key = JSON.stringify([country, grade, title]);
      const cluster = clusters.get(key) ?? { country_code: country, grade_number: grade, normalized_title: title, lesson_ids: [] };
      cluster.lesson_ids.push(id);
      clusters.set(key, cluster);
    } else unscopedIds.push(id);
    const summary = clean(row.summary);
    const content = clean(row.content);
    if (!sourceUnready(row.instructions) && (summary.length < 50 || content.length < 150)) {
      limitedTextCandidates.push(id); // Heuristic; activities and audio may exist.
    }
    const claimText = [row.title, row.summary, row.content].map((x) => String(x ?? "")).join(" ");
    if (/محتوى رسمي|من كتاب الوزارة|معتمد من|مطابق للمنهج/u.test(claimText)) {
      officialClaimCandidates.push(id); // Manual source verification only.
    }
  }
  const duplicateTitleGroups = [...clusters.values()]
    .filter((g) => new Set(g.lesson_ids).size > 1)
    .sort((a, b) => a.country_code.localeCompare(b.country_code) || a.grade_number - b.grade_number || a.normalized_title.localeCompare(b.normalized_title, "ar"));
  return {
    audit_type: "offline_heuristic_not_seo_certification",
    source: "caller_supplied_local_export_only",
    counts: {
      rows: rows.length, published: published.length,
      published_explicit_source_unready: sourceUnreadyIds.length,
      duplicate_title_groups: duplicateTitleGroups.length,
      limited_text_candidates: limitedTextCandidates.length,
      official_claim_candidates: officialClaimCandidates.length,
      missing_country_grade_or_title: unscopedIds.length,
    },
    duplicate_title_groups: duplicateTitleGroups,
    limited_text_candidate_ids: limitedTextCandidates,
    official_claim_candidate_ids: officialClaimCandidates,
    explicit_source_unready_ids: sourceUnreadyIds,
    missing_scope_ids: unscopedIds,
    disclaimer: "Repeated titles, short text and official-looking phrases require human review. Do not noindex, consolidate, claim originality or change canonicals from this report alone.",
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const input = process.argv.find((x) => x.startsWith("--input="))?.slice(8);
  const output = process.argv.find((x) => x.startsWith("--output="))?.slice(9);
  if (!input) {
    console.error("Usage: node scripts/audit-exported-lessons-seo.mjs --input=isolated-export.json [--output=report.json]");
    process.exitCode = 2;
  } else {
    const report = auditExportedLessonsSeo(JSON.parse(readFileSync(resolve(input), "utf8")));
    if (output) writeFileSync(resolve(output), JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
  }
}
