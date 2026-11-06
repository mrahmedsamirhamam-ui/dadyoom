import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const base = process.env.DADYOOM_HOME_SMOKE_URL || "http://127.0.0.1:3033";
mkdirSync("artifacts/home", { recursive:true });
const metrics = [];
const browser = await chromium.launch({ channel:"chrome", headless:true, args:["--no-sandbox"] });
function intersects(a,b) {
  return a.x < b.x+b.width && a.x+a.width > b.x &&
    a.y < b.y+b.height && a.y+a.height > b.y;
}
try {
  for(const width of [360,390,430]){
    const page = await browser.newPage({viewport:{width,height:800},locale:"ar-BH",reducedMotion:"reduce"});
    await page.addInitScript(() => {
      window.__homeVitals = { lcp: null, cls: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__homeVitals.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__homeVitals.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch {}
    });
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
    assert.equal(await page.locator(".hero-cta").getAttribute("href"),"/try");
    assert.equal(await page.locator(".dadyoom-home-header-cta").getAttribute("href"),"/try");
    for(const path of ["/student","/teacher","/parent","/school"]){
      assert.equal(await page.locator('a[href="'+path+'"]').count(),1,"Role link missing: "+path);
    }
    await page.screenshot({path:"artifacts/home/mobile-"+width+".png",fullPage:true,animations:"disabled"});
    metrics.push({width,...await page.evaluate(()=>window.__homeVitals)});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Horizontal overflow at "+width);
    await page.close();
  }
  const desktop=await browser.newPage({viewport:{width:1366,height:900},locale:"ar-BH",reducedMotion:"reduce"});
  await desktop.goto(base+"/",{waitUntil:"domcontentloaded"});
  await desktop.screenshot({path:"artifacts/home/desktop-1366.png",fullPage:true,animations:"disabled"});
  assert.ok(await desktop.locator(".dadyoom-home-header-cta").isVisible());
  assert.ok(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Desktop overflow");
  await desktop.close();
  writeFileSync("artifacts/home/mobile-web-vitals.json",JSON.stringify({note:"single-run lab approximations, not Lighthouse or a baseline comparison",metrics},null,2));
  console.log("Home smoke PASS for 360/390/430/1366; screenshots and lab web-vitals saved");
} finally {await browser.close();}
