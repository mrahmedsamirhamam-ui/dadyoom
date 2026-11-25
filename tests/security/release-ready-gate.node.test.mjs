import test from "node:test";
import assert from "node:assert/strict";
import { assertReleaseReady } from "../../scripts/security/assert-release-ready.mjs";

const ids = ["role_escalation","tenant_isolation","student_isolation","parent_child_isolation","answer_key_and_grades","jwt_idor_injection","audit_logs","backup_restore","staging_pilot"];
const valid = () => ({
  schemaVersion: 1, releaseDecision: "GO", securityReadinessScore: 95,
  verifiedAt: new Date().toISOString(), criticalVulnerabilities: 0,
  highVulnerabilities: 0, approvalUrl: "https://example.org/approval",
  requiredGates: ids.map(id => ({ id, status: "passed", evidenceUrl: "https://example.org/evidence/" + id })),
});
test("valid synthetic evidence can pass the pure validator", () => assert.equal(assertReleaseReady(valid()), true));
test("NO_GO blocks release", () => assert.throws(() => assertReleaseReady({ ...valid(), releaseDecision: "NO_GO" })));
test("missing tenant isolation blocks release", () => { const v = valid(); v.requiredGates.splice(1,1); assert.throws(() => assertReleaseReady(v)); });
test("missing evidence URL blocks release", () => { const v = valid(); delete v.requiredGates[0].evidenceUrl; assert.throws(() => assertReleaseReady(v)); });
test("high vulnerability blocks release regardless of score", () => assert.throws(() => assertReleaseReady({ ...valid(), highVulnerabilities: 1, securityReadinessScore: 100 })));
test("expired review blocks release", () => assert.throws(() => assertReleaseReady({ ...valid(), verifiedAt: "2020-01-01T00:00:00Z" })));
test("missing owner approval blocks release", () => assert.throws(() => assertReleaseReady({ ...valid(), approvalUrl: null })));
test("duplicate gate cannot substitute missing gate", () => { const v = valid(); v.requiredGates[1] = v.requiredGates[0]; assert.throws(() => assertReleaseReady(v)); });
