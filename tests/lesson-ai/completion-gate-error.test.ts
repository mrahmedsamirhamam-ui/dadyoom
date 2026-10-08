import {expect,it,describe} from "vitest";
import {isCompletionGateError} from "@/lib/lesson-activities/completion-gate-error";
describe("canonical lesson completion HTTP conflict classification",()=>{
 it("labels incomplete required and graded activities as an actionable conflict",()=>{
  expect(isCompletionGateError("أكمل أنشطة التقويم المطلوبة أولًا. 0 / 2")).toBe(true);
  expect(isCompletionGateError("أكمل جميع الأنشطة القابلة للتصحيح أولاً. 2 / 3")).toBe(true);
  expect(isCompletionGateError("أجب عن جميع أسئلة الدرس أولاً.")).toBe(true);
 });
 it("retains 409 when score is below required mastery",()=>{
  expect(isCompletionGateError("مستوى إتقانك الحالي 80%. المطلوب 90%")).toBe(true);
 });
 it("does not conceal infrastructure failures as a student conflict",()=>{
  expect(isCompletionGateError("Worker exceeded CPU time limit")).toBe(false);
  expect(isCompletionGateError("Connection reset")).toBe(false);
  expect(isCompletionGateError("permission denied for relation")).toBe(false);
 });
});