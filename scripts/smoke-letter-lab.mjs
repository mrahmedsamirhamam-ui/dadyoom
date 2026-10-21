import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.LETTER_LAB_SMOKE_URL || "http://127.0.0.1:3033";
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
  await page.goto(base + "/labs/letters", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "من الحرف إلى المعنى" }).waitFor();
  await page.getByRole("button", { name: "اختر الحرف ش" }).click();
  await page.getByRole("heading", { name: "ابنِ الكلمة بنفسك" }).waitFor();

  for (const letter of ["ش", "ج", "ر", "ة"]) {
    await page.locator('[aria-label="بطاقات الحروف"] button')
      .filter({ hasText: letter })
      .first()
      .click();
  }

  await page.getByRole("button", { name: "تحقق من الكلمة" }).click();
  await page.getByRole("heading", { name: "اختر معنى الكلمة" }).waitFor();
  await page.getByRole("button", { name: "نبات له جذع وأغصان", exact: true }).click();
  await page.getByRole("heading", { name: "شجرة", exact: true }).waitFor();
  assert.match(await page.locator("body").innerText(), /تمنحنا الشجرة الظل/);

  await page.getByRole("button", { name: /الكلمة التالية/ }).click();
  await page.getByRole("button", { name: "البناء", exact: true }).click();
  await page.getByRole("button", { name: "اختر الحرف م" }).waitFor();

  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    "The interactive lab should not overflow a 390px mobile viewport",
  );
  console.log("Letter lab mobile browser smoke: PASS");
} finally {
  await browser.close();
}
