import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(here, "../../docs/security/P0_RELEASE_EVIDENCE.json"), "utf8"));
const required = [
  "role_escalation", "tenant_isolation", "student_isolation",
  "parent_child_isolation", "answer_key_and_grades",
  "jwt_idor_injection", "audit_logs", "backup_restore", "staging_pilot",
];
const gates = new Map(manifest.requiredGates?.map(g => [g.id, g.status]) ?? []);
const allowed = new Set(["unverified", "failed", "passed"]);
const errors = [];
if (manifest.schemaVersion !== 1) errors.push("Unsupported evidence schema");
for (const id of required) {
  if (!gates.has(id) || !allowed.has(gates.get(id))) errors.push("Missing/invalid gate: " + id);
}
if (manifest.releaseDecision === "GO" && (
  required.some(id => gates.get(id) !== "passed") ||
  typeof manifest.verifiedAt !== "string" ||
  !manifest.verifiedAt ||
  typeof manifest.securityReadinessScore !== "number"
)) errors.push("GO is forbidden without all passed gates, verification timestamp and score");
if (!["GO", "NO_GO"].includes(manifest.releaseDecision)) errors.push("Invalid release decision");
if (errors.length) {
  console.error("P0 EVIDENCE INVALID: " + errors.join("; "));
  process.exit(1);
}
console.log("P0 evidence manifest valid; release decision: " + manifest.releaseDecision);
if (manifest.releaseDecision !== "GO") {
  console.log("NO-GO: this check validates documentation only; it does not authorize deployment.");
}
