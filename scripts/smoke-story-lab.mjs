import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.STORY_LAB_SMOKE_URL || "http://127.0.0.1:3033";
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

  await page.goto(base + "/labs/stories", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "اختر حكايتك التعليمية" }).waitFor();
  assert.equal(await page.getByRole("link", { name: /ابدأ الحكاية/ }).count(), 4);

  await page.goto(base + "/labs/stories/final-hamza", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "رحلة الهمزة إلى كرسيها" }).waitFor();
  for (let scene = 0; scene < 4; scene++) {
    await page.getByRole("button", { name: /المشهد التالي|هيا نتدرّب/ }).click();
  }

  await page.getByRole("button", { name: "شاطِؤ", exact: true }).click();
  await page.getByRole("status").filter({ hasText: /الكسرة تناسب النبرة/ }).waitFor();
  for (const answer of ["شاطِئ", "تباطُؤ", "ملجَأ", "دفْء"]) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: /السؤال التالي|اعرض نتيجة التدريب/ }).click();
  }
  await page.getByRole("heading", { name: "أحسنت، أكملت الحكاية!" }).waitFor();
  assert.match(await page.locator("body").innerText(), /3 من 4 إجابات صحيحة من المحاولة الأولى/);
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    "Story lab must not overflow a 390px mobile viewport",
  );

  await page.reload();
  await page.getByRole("button", { name: "المشهد التالي ←" }).waitFor();
  assert.doesNotMatch(await page.locator("body").innerText(), /3 من 4 إجابات صحيحة من المحاولة الأولى/);
  await page.goto(base + "/labs/stories/matching-apposition", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "الاسم الذي يوضح الاسم" }).waitFor();
  for (let scene = 0; scene < 4; scene++) {
    await page.getByRole("button", { name: /المشهد التالي|هيا نتدرّب/ }).click();
  }
  for (const answer of ["الطالبُ", "مريمَ", "مالكٍ", "قابلتُ المعلّمَ معتزًّا"]) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: /السؤال التالي|اعرض نتيجة التدريب/ }).click();
  }
  await page.getByRole("heading", { name: "أحسنت، أكملت الحكاية!" }).waitFor();
  assert.match(await page.locator("body").innerText(), /4 من 4 إجابات صحيحة من المحاولة الأولى/);
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    "Matching-apposition story must not overflow a 390px mobile viewport",
  );

  console.log("Story lab: 4 narratives, graded practice, hints, ephemeral session and mobile layout: PASS");
} finally {
  await browser.close();
}
