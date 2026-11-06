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
    const headlineLines=await page.locator("h1.dadyoom-home-title").evaluate((element) => {
      const style=getComputedStyle(element);
      return Math.round(element.getBoundingClientRect().height / parseFloat(style.lineHeight));
    });
    assert.ok(headlineLines <= 2,"Homepage headline exceeds two lines at "+width+": "+headlineLines);
    assert.equal(await page.locator(".hero-cta").getAttribute("href"),"/signup");
    assert.equal(await page.locator(".hero-secondary").getAttribute("href"),"/try");
    assert.equal(await page.locator(".dadyoom-home-header-cta").getAttribute("href"),"/try");
    for(const path of ["/student","/teacher","/parent","/school"]){
      assert.equal(await page.locator('a[href="'+path+'"]').count(),1,"Role link missing: "+path);
    }
    await page.screenshot({path:"artifacts/home/mobile-"+width+".png",fullPage:true,animations:"disabled"});
    metrics.push({width,...await page.evaluate(()=>window.__homeVitals)});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Horizontal overflow at "+width);
    // Scroll to the end as in the reported screen recording: links must never sit behind fixed controls.
    const footer=page.locator("footer[data-dadyoom-home-footer]");
    await footer.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.documentElement.classList.contains("dadyoom-home-footer-visible"));
    assert.equal(await dock.evaluate(el=>getComputedStyle(el).visibility),"hidden","Install launcher covers footer at "+width);
    assert.equal(await dad.evaluate(el=>getComputedStyle(el).visibility),"hidden","Dad bubble covers footer at "+width);
    for (const a of await footer.locator("a").all()) {
      const rect=await a.boundingBox();
      assert.ok(rect && rect.height>=44,"Footer link has an undersized target at "+width);
    }
    await page.screenshot({path:"artifacts/home/footer-"+width+".png",animations:"disabled"});
    await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
    await page.waitForFunction(()=>!document.documentElement.classList.contains("dadyoom-home-footer-visible"));
    let keyboardCanReachHero = false;
    for (let tab = 0; tab < 25; tab++) {
      await page.keyboard.press("Tab");
      if (await page.locator(".hero-cta").evaluate(el=>document.activeElement===el)) {
        keyboardCanReachHero = true;
        break;
      }
    }
    assert.ok(keyboardCanReachHero,"Keyboard Tab cannot reach hero CTA at "+width);
    await page.keyboard.press("Tab");
    assert.ok(await page.locator(".hero-secondary").evaluate(el=>document.activeElement===el),"Keyboard next Tab cannot reach free trial button at "+width);
    await page.keyboard.press("Enter");
    await page.waitForURL("**/try",{timeout:15000});
    assert.ok(await page.getByRole("heading",{name:"خطوة صغيرة في العربية"}).isVisible(),"Guest lesson not reachable by keyboard");
    await page.goto(base+"/",{waitUntil:"domcontentloaded"});
    await page.locator("[data-dadyoom-install-dismiss]").click();
    await page.locator(".floating-dock").waitFor({state:"hidden"});
    await page.reload({waitUntil:"domcontentloaded"});
    await page.locator(".floating-dock").waitFor({state:"hidden",timeout:15000});
    await page.close();
  }
  const desktop=await browser.newPage({viewport:{width:1366,height:900},locale:"ar-BH",reducedMotion:"reduce"});
  await desktop.goto(base+"/",{waitUntil:"domcontentloaded"});
  await desktop.screenshot({path:"artifacts/home/desktop-1366.png",fullPage:true,animations:"disabled"});
  assert.ok(await desktop.locator(".dadyoom-home-header-cta").isVisible());
  assert.ok(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),"Desktop overflow");
  await desktop.close();
  writeFileSync("artifacts/home/mobile-web-vitals.json",JSON.stringify({note:"single-run lab approximations, not Lighthouse or a baseline comparison",metrics},null,2));
  console.log("Home mobile polish smoke PASS: 360/390/430/1366, full page, footer, RTL, keyboard and PWA dismiss persistence");
} finally {await browser.close();}
