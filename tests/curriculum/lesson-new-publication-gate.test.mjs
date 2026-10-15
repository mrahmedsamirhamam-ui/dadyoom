import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const action = readFileSync("app/admin/lessons/new/actions.ts","utf8");
const form = readFileSync("app/admin/lessons/new/lesson-form.tsx","utf8");
describe("Dadyoom deliberate lesson publication gate",()=>{
 it("defaults to a draft, and only demands review consent when publishing",()=>{
  expect(form).toContain('const [publishNow, setPublishNow] = useState(false)');
  expect(form).toContain('value={publishNow ? "true" : "false"}');
  expect(form).toContain('name="publish_review_ack" required');
  expect(form).toContain('سيُحفظ الدرس مسودة دون نشر');
 });
 it("server independently enforces review acknowledgment before any lesson write",()=>{
  expect(action).toContain('formData.get("publish_review_ack") === "on"');
  expect(action).toContain("if (isPublished && !reviewedForPublication)");
  expect(action.indexOf("if (isPublished && !reviewedForPublication)")).toBeLessThan(
    action.indexOf('.from("lessons")')
  );
  expect(action).toContain('status:\n          "draft"');
  expect(action).toContain("PUBLISH LAST");
 });
});
