import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.DADYOOM_GUEST_SMOKE_URL || "http://127.0.0.1:3033";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--no-sandbox"] });
await mkdir("artifacts", { recursive: true });

try {
  for (const width of [360, 390, 430, 1280]) {
    const page = await browser.newPage({
      viewport: { width, height: 820 },
      locale: "ar-BH",
      reducedMotion: "reduce",
    });
    await page.goto(base + "/try", { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "قبل أن نبدأ" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "فتح ضاد" }).count(), 0, "No floating AI interruption on /try");
    assert.equal(await page.getByRole("button", { name: "تنزيل ضاديوم على الهاتف" }).count(), 0, "No installer interruption on /try");
    assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
    assert.equal(await page.getByRole("progressbar", { name: "تقدم التجربة" }).getAttribute("aria-valuenow"), "0");
    await page.getByRole("button", { name: "ابدأ التطبيق" }).click();
    await page.getByRole("heading", { name: "أي كلمة تدل على فعل؟" }).waitFor();
    await page.getByRole("button", { name: "يركض" }).click();
    await page.getByRole("button", { name: "تحقق من إجابتي" }).click();
    await page.getByRole("status").getByText("إجابة صحيحة!").waitFor();
    await page.getByRole("button", { name: "السؤال التالي" }).click();
    await page.getByRole("heading", { name: "أي جملة تبدأ بفعل؟" }).waitFor();
    await page.getByRole("button", { name: "يقرأ سالم قصة" }).click();
    await page.getByRole("button", { name: "تحقق من إجابتي" }).click();
    await page.getByRole("button", { name: "السؤال التالي" }).click();
    await page.getByRole("heading", { name: "تحقق جديد: أي جملة تبدأ بفعل؟" }).waitFor();
    await page.getByRole("button", { name: "القصة جميلة" }).click();
    await page.getByRole("button", { name: "تحقق من إجابتي" }).click();
    await page.getByRole("status").getByText("الإجابة الصحيحة: يكتب مازن رسالة").waitFor();
    await page.getByRole("button", { name: "اعرض ملخص التجربة" }).click();
    await page.getByRole("heading", { name: "أنهيت التجربة القصيرة" }).waitFor();
    assert.equal(await page.getByText("نجحت في سؤال التحقق الجديد", { exact: false }).count(), 0);
    await page.getByText("سؤال التحقق الجديد يحتاج مراجعة", { exact: false }).waitFor();
    assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "3");
    assert.equal(await page.getByRole("link", { name: "أنشئ حسابًا لحفظ تقدمك القادم" }).getAttribute("href"), "/signup");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "Horizontal overflow at " + width);
    await page.screenshot({ path: `artifacts/guest-learning-${width}.png`, fullPage: true });
    await page.getByRole("button", { name: "راجع المثال وأعد التدريب" }).click();
    await page.getByRole("heading", { name: "قبل أن نبدأ" }).waitFor();
    await page.close();
    console.log(`GUEST_FLOW_PASS viewport=${width}`);
  }
} finally {
  await browser.close();
}
