import test from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

// E2E requires an isolated, running QA app with a seeded lesson whose SIX axes
// are approved. Never target production or a generic deploy preview.
const baseText = process.env.DADYOOM_E2E_BASE_URL || "";
const approvedLessonId = process.env.DADYOOM_E2E_APPROVED_LESSON_ID || "";
const base = baseText ? new URL(baseText) : null;
const permitted = base && ["localhost","127.0.0.1","::1"].includes(base.hostname)
  && (base.protocol === "http:" || base.protocol === "https:");
const configured = Boolean(permitted && /^[a-f0-9-]{36}$/i.test(approvedLessonId));
test("visitor browser: no review badge with six approved axes in QA fixture", {
  skip: configured ? false : "Requires isolated localhost QA web server plus preapproved fixture lesson; production forbidden.",
}, async () => {
  const browser = await chromium.launch({ headless:true });
  try {
    for(const pagePath of ["/", "/study", "/courses", "/lessons/"+approvedLessonId]){
      const page=await browser.newPage();
      const response=await page.goto(new URL(pagePath,base).href,{waitUntil:"domcontentloaded"});
      assert.ok(response && response.status()<500, "QA route failed: "+pagePath);
      assert.equal(await page.getByTestId("dadyoom-reviewed-badge").count(),0, pagePath);
      assert.equal(await page.getByText("روجع واعتُمد",{exact:true}).count(),0, pagePath);
      await page.close();
    }
  } finally { await browser.close(); }
});
