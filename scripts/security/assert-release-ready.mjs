import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export function assertReleaseReady(manifest) {
  const required = [
    "role_escalation", "tenant_isolation", "student_isolation",
    "parent_child_isolation", "answer_key_and_grades", "jwt_idor_injection",
    "audit_logs", "backup_restore", "staging_pilot",
  ];
  if (!manifest || manifest.schemaVersion !== 1) throw new Error("Unsupported release evidence");
  const gates = manifest.requiredGates;
  if (!Array.isArray(gates) || gates.length !== required.length ||
      new Set(gates.map(g => g.id)).size !== required.length ||
      required.some(id => !gates.some(g => g.id === id && g.status === "passed" &&
        typeof g.evidenceUrl === "string" && /^https:\/\//.test(g.evidenceUrl)))) {
    throw new Error("Release blocked: mandatory security evidence is incomplete");
  }
  if (manifest.releaseDecision !== "GO" ||
      !Number.isFinite(manifest.securityReadinessScore) ||
      manifest.securityReadinessScore < 95 ||
      typeof manifest.verifiedAt !== "string" ||
      !Number.isFinite(Date.parse(manifest.verifiedAt)) ||
      Date.now() - Date.parse(manifest.verifiedAt) > 7 * 24 * 3600 * 1000 ||
      Date.parse(manifest.verifiedAt) > Date.now()) {
    throw new Error("Release blocked: no current approved security readiness");
  }
  if (manifest.criticalVulnerabilities !== 0 || manifest.highVulnerabilities !== 0) {
    throw new Error("Release blocked: unresolved critical/high vulnerabilities");
  }
  if (typeof manifest.approvalUrl !== "string" || !/^https:\/\//.test(manifest.approvalUrl)) {
    throw new Error("Release blocked: owner approval evidence missing");
  }
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const path = resolve(dirname(fileURLToPath(import.meta.url)), "../../docs/security/P0_RELEASE_EVIDENCE.json");
    assertReleaseReady(JSON.parse(readFileSync(path, "utf8")));
    console.log("Security evidence gate passed. Separate runtime authorization still required.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Security gate failed");
    process.exitCode = 1;
  }
}
