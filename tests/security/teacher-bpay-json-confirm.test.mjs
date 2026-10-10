import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

test("BPay teacher confirmation uses small JSON route and no RSC Server Action", () => {
  const client = readFileSync("app/(dashboard)/teacher/marketplace/TeacherMarketplaceClient.tsx", "utf8");
  expect(client).toContain('fetch("/api/teacher/marketplace/bpay/confirm"');
  expect(client).not.toContain("confirmBpayCoursePayment,");
  expect(client).toContain('credentials: "same-origin"');
  expect(client).toContain("disabled={busyPaymentId !== null}");
  expect(client).toContain("if (response.ok && result.ok) router.refresh()");
  expect(client).toContain("Never automatically retry");
});

test("BPay JSON confirmation enforces user, role, course ownership before provisioning", () => {
  const route = readFileSync("app/api/teacher/marketplace/bpay/confirm/route.ts", "utf8");
  expect(route).toContain('request.headers.get("origin")');
  expect(route).toContain('request.headers.get("content-type")');
  expect(route).toContain("db.auth.getUser()");
  expect(route).toContain('.from("profiles")');
  expect(route).toContain('["teacher", "admin"]');
  expect(route).toContain('.eq("kind", "course")');
  expect(route).toContain('.eq("provider", "bpay")');
  expect(route).toContain('.eq("teacher_id", user.id)');
  expect(route.indexOf('.eq("teacher_id", user.id)')).toBeLessThan(route.indexOf('payment.status === "completed"'));
  expect(route).toContain('payment.status !== "approved" || !payment.bank_reference');
  expect(route).toContain("await finalizePaymentOrder(paymentOrderId)");
  expect(route).not.toContain("createPaymentRecord");
});
