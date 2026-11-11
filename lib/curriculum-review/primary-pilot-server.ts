import "server-only";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, resolve, sep } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { isPilotAuditRow, pilotLane, type PilotRow } from "./primary-pilot";

export type PilotReport = {
  rows: PilotRow[];
  reportHash: string;
  counts: Record<"green"|"yellow"|"red", number>;
  snapshotComplete: boolean;
};
export function loadPrimaryPilotReport(): PilotReport {
  const location = process.env.DADYOOM_CM1_AUDIT_REPORT_PATH;
  if (!location || !isAbsolute(location)) throw new Error("CM1_LOCAL_REPORT_PATH_REQUIRED");
  const filename = realpathSync(location);
  const publicDir = resolve(process.cwd(), "public") + sep;
  if (filename.startsWith(publicDir) || filename.includes(sep + "node_modules" + sep)) {
    throw new Error("CM1_REPORT_MUST_NOT_BE_PUBLIC");
  }
  if (statSync(filename).size > 10 * 1024 * 1024) throw new Error("CM1_REPORT_TOO_LARGE");
  const text = readFileSync(filename, "utf8");
  const raw: unknown = JSON.parse(text);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("CM1_REPORT_INVALID");
  const report = raw as Record<string, unknown>;
  if (!Array.isArray(report.lesson_audit)) throw new Error("CM1_LESSON_MATRIX_MISSING");
  const complete = report.missing_data_warning === false
    && !!report.provenance && typeof report.provenance === "object"
    && (report.provenance as Record<string,unknown>).complete === true;
  const rows: PilotRow[] = [];
  const seen = new Set<string>();
  for (const input of report.lesson_audit) {
    if (!isPilotAuditRow(input)) throw new Error("CM1_REPORT_ROW_INVALID");
    if (input.country !== "BH" || ![1,2,3].includes(input.grade)) continue;
    if (seen.has(input.id)) throw new Error("CM1_DUPLICATE_LESSON_ID");
    seen.add(input.id);
    rows.push({ ...input, lane: pilotLane(input, complete) });
  }
  rows.sort((a,b)=>a.grade-b.grade || a.title.localeCompare(b.title,"ar") || a.id.localeCompare(b.id));
  const counts: PilotReport["counts"] = {green:0,yellow:0,red:0};
  for (const row of rows) counts[row.lane]++;
  return { rows, counts, snapshotComplete:complete, reportHash:createHash("sha256").update(text).digest("hex") };
}

/** Requires a physically distinct staging project and explicit local opt-in. */
export function stagingPilotClient() {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.DADYOOM_CM1_STAGING_WRITES_ENABLED !== "true") return null;
  const stageUrl = process.env.DADYOOM_CM1_STAGING_URL?.trim();
  const secret = process.env.DADYOOM_CM1_STAGING_SERVICE_ROLE_KEY?.trim();
  const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!stageUrl || !secret || !prodUrl) return null;
  let stage: URL; let prod: URL;
  try { stage=new URL(stageUrl); prod=new URL(prodUrl); } catch { return null; }
  if (stage.protocol !== "https:" || stage.origin === prod.origin) return null;
  if (!/\.supabase\.co$/i.test(stage.hostname)) return null;
  if (process.env.DADYOOM_CM1_STAGING_PROJECT_REF !== stage.hostname.split(".")[0]) return null;
  return createClient(stage.origin,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
