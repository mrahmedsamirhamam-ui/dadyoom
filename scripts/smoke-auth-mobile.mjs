import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.AUTH_MOBILE_SMOKE_URL || "http://127.0.0.1:3037";
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
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));

  // One focused mobile login form for an anonymous account.
  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "تسجيل الدخول" }).waitFor();
  assert.equal(await page.locator('form input[type="email"]').count(), 1);
  assert.equal(await page.locator('form input[type="password"]').count(), 1);
  assert.equal(await page.locator('form button[type="submit"]').count(), 1);
  assert.equal(await page.getByRole("link", { name: /إنشاء حساب جديد/ }).count(), 1);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    true, "Login must never overflow a 390px viewport",
  );

  // No duplicate login tab and role cards are reachable on a phone.
  await page.getByRole("link", { name: /إنشاء حساب جديد/ }).click();
  await page.getByRole("heading", { name: "إنشاء حساب جديد" }).waitFor();
  assert.equal(await page.locator('form button[type="submit"]').count(), 1);
  const teacher = page.locator('form button').filter({ hasText: "معلم" }).first();
  await teacher.click();
  assert.equal(await teacher.getAttribute("aria-pressed"), "true");
  assert.equal(await page.getByRole("link", { name: /تسجيل الدخول/ }).count(), 1);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2),
    true, "Signup must never overflow a 390px viewport",
  );

  // Anonymous users cannot enter private role management through a URL.
  await page.goto(base + "/my", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "تسجيل الدخول" }).waitFor();
  await page.goto(base + "/account/role-request", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "تسجيل الدخول" }).waitFor();

  assert.deepEqual(errors, [], "Browser runtime errors: " + errors.join("; "));
  console.log("Dadyoom mobile Chrome anonymous login/signup and route security: PASS");
} finally {
  await browser.close();
}
