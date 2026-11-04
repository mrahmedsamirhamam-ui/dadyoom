import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.TEACHER_FEEDBACK_SMOKE_URL || "http://127.0.0.1:3035";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    locale: "ar-BH",
  });
  let submitted = false;
  page.on("request", (request) => {
    if (request.method() !== "GET" && /\/api\//.test(request.url())) {
      submitted = true;
    }
  });
  await page.goto(base + "/resources/teacher-feedback", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "من الملاحظة إلى خطوة تحسن قابلة للقياس" }).waitFor();

  const copy = page.getByRole("button", {
    name: "نسخ الملاحظة والخطة بعد اعتماد المعلم",
  });
  assert.ok(await copy.isDisabled(), "No feedback should be exportable without evidence");

  const evidence = page.getByRole("textbox", { name: /شاهد الأداء الحقيقي/ });
  await evidence.fill("حدد الفكرة الرئيسة للنص لكنه لم يذكر شاهدًا يدل عليها.");
  assert.ok(await copy.isDisabled(), "Evidence alone must not bypass teacher approval");

  const approval = page.getByRole("checkbox", { name: /راجعتُ الشاهد/ });
  await approval.check();
  assert.ok(await copy.isEnabled(), "Teacher-approved evidence may be copied");

  await evidence.fill("قرأ النص الجديد ثم استدل بشاهد صحيح للإجابة.");
  assert.ok(await copy.isDisabled(), "Any edit must revoke an earlier approval");
  assert.ok(!await approval.isChecked());

  assert.equal(submitted, false, "Personalized evidence must not be POSTed to any API");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), "RTL mobile page must not overflow");
  console.log("Teacher feedback mobile browser smoke: PASS");
} finally {
  await browser.close();
}
