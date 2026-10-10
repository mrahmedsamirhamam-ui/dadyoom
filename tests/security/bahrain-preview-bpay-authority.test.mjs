import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("legacy teacher BPay action never reveals payment status before ownership check", () => {
  const source=readFileSync("features/marketplace/actions.ts","utf8");
  const action=source.slice(source.indexOf("export async function confirmBpayCoursePayment("));
  const ownership=action.indexOf('.eq("teacher_id", user.id)');
  const status=action.indexOf('if (payment.status === "completed")');
  expect(ownership).toBeGreaterThan(0);
  expect(status).toBeGreaterThan(ownership);
  expect(action).toContain('await finalizePaymentOrder(paymentOrderId)');
});

test("Bahrain unpublished lesson preview requires a trusted server-side reviewer", () => {
  const source=readFileSync("features/lessons/queries/getLessonPageBundle.ts","utf8");
  expect(source).not.toContain("user.user_metadata?.country");
  expect(source).toContain('.from("edu_admin_users")');
  expect(source).toContain('.eq("user_id", user.id)');
  expect(source).toContain("if (reviewerError || !trustedReviewer)");
  expect(source).toContain('process.env.DADYOOM_BAHRAIN_PREVIEW');
});

test("Bahrain country-grade directory displays its official TOC caveat and real report numbers", () => {
  const source=readFileSync("app/curriculum/[country]/[grade]/page.tsx","utf8");
  expect(source).toContain("bahrainBookAudit.books.filter((row) => row.grade === gradeValue)");
  expect(source).toContain('info.code === "BH"');
  expect(source).toContain('row.status === "COMPLETE_BOOK"');
  expect(source).toContain('bahrainTerm2CurrentPlanVerified');
  expect(source).toContain('https://edunet.bh/Econtent/BooksGuide');
  expect(source).toContain('https://edunet.bh/Econtent/LessonsGuide');
});
