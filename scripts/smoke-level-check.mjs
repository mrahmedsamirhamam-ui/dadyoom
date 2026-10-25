import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.LEVEL_CHECK_SMOKE_URL || "http://127.0.0.1:3033";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    locale: "ar-BH",
    reducedMotion: "reduce",
  });
  await page.goto(base + "/level-check", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "اكتشف من أين تبدأ رحلتك في العربية" }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "السؤال التالي" }).isDisabled(), true,
    "Do not advance without an answer",
  );

  for (let index = 0; index < 12; index += 1) {
    await page.locator('fieldset input[type="radio"]').first().check();
    await page.getByRole("button", {
      name: index === 11 ? "اعرض نتيجتي" : "السؤال التالي",
    }).click();
  }

  await page.getByText("النتيجة الاسترشادية").waitFor();
  await page.getByText(/خطوتك التالية/).waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    "Level check should not overflow a mobile viewport",
  );

  await page.getByRole("button", { name: "أعد النشاط من البداية" }).click();
  await page.getByRole("button", { name: "السؤال التالي" }).waitFor();
  console.log("Arabic level check mobile browser smoke: PASS");
} finally {
  await browser.close();
}
