import assert from "node:assert/strict";
import { chromium } from "playwright";
const base=process.env.DADYOOM_ADAPTIVE_SMOKE_URL||"http://127.0.0.1:3033";
const browser=await chromium.launch({channel:"chrome",headless:true,args:["--no-sandbox"]});
try {
  for(const width of [360,390,430]){
    const page=await browser.newPage({viewport:{width,height:820},locale:"ar-BH",reducedMotion:"reduce"});
    await page.goto(base+"/labs/hal-adaptive",{waitUntil:"domcontentloaded"});
    await page.getByRole("heading",{name:"الحال: كيف حدث الفعل؟"}).waitFor();
    for(const [i,answer] of [2,0,1,1].entries()){
      await page.locator("fieldset").nth(i).locator('input[type="radio"]').nth(answer).check();
    }
    await page.getByRole("button",{name:"ابدأ الدرس"}).click();
    await page.getByText("اقتراح اليوم: مسار التحدي").waitFor();
    await page.getByRole("button",{name:"مسار البداية"}).click();
    for(const [i,answer] of [2,1,1].entries()){
      await page.locator("fieldset").nth(i).locator('input[type="radio"]').nth(answer).check();
    }
    await page.getByRole("button",{name:"تحقق من تدريباتي"}).click();
    await page.getByText("الإجابات الصحيحة: 3 من 3.").waitFor();
    await page.getByRole("button",{name:"انتقل للتقييم المشترك"}).click();
    for(const [i,answer] of [2,0,1,2,1].entries()){
      await page.locator("fieldset").nth(i).locator('input[type="radio"]').nth(answer).check();
    }
    await page.getByRole("button",{name:"صحح تقييمي"}).click();
    await page.getByText("حققت معيار الإتقان الفوري").waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2),"Horizontal overflow "+width);
    await page.close();
  }
  console.log("Adaptive الحال smoke PASS for 360/390/430");
} finally {await browser.close();}
