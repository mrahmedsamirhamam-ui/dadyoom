import assert from "node:assert/strict";
import { chromium } from "playwright";

const base = process.env.DADYOOM_HOME_SMOKE_URL || "http://127.0.0.1:3033";
const browser = await chromium.launch({ channel:"chrome", headless:true, args:["--no-sandbox"] });
function intersects(a,b) {
  return a.x < b.x+b.width && a.x+a.width > b.x &&
    a.y < b.y+b.height && a.y+a.height > b.y;
}
try {
  for(const width of [360,390,430]){
    const page = await browser.newPage({viewport:{width,height:800},locale:"ar-BH",reducedMotion:"reduce"});
    await page.goto(base+"/",{waitUntil:"domcontentloaded"});
    const dock=page.locator(".floating-dock");
    const dad=page.locator("[data-dad-floating-root]");
    await dock.waitFor({timeout:15000});
    await dad.waitFor({timeout:15000});
    const left=await dock.boundingBox(),right=await dad.boundingBox();
    assert.ok(left&&right,"Both floating controls must be visible");
    assert.ok(!intersects(left,right),"Floating widgets overlap at "+width);
    assert.ok(left.x+left.width<=right.x-8,"No 8px horizontal separation at "+width);
    assert.ok(await page.locator(".hero-cta").isVisible(),"Hero CTA missing");
    assert.equal(await page.locator(".hero-cta").getAttribute("href"),"/signup");
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Horizontal overflow at "+width);
    await page.close();
  }
  console.log("Home floating dock smoke PASS for 360/390/430");
} finally {await browser.close();}
