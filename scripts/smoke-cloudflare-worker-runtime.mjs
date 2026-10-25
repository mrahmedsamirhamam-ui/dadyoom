import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const host="127.0.0.1";
const port=31767;
const url=`http://${host}:${port}`;
const worker=spawn(process.execPath,[
  resolve("node_modules/vite/bin/vite.js"),
  "preview", "--host", host, "--port", String(port), "--strictPort"
],{
  cwd:process.cwd(),
  env:{...process.env,CI:"true",NEXT_TELEMETRY_DISABLED:"1"},
  stdio:["ignore","pipe","pipe"],
});
let diagnostics="";
for(const stream of [worker.stdout, worker.stderr]){
  stream.on("data",chunk=>{
    diagnostics=(diagnostics+String(chunk)).slice(-7000);
  });
}
const sleep=t=>new Promise(resolve=>setTimeout(resolve,t));
async function get(path,timeout=3500){
  return fetch(url+path,{redirect:"manual",signal:AbortSignal.timeout(timeout)});
}
try {
  let started=false;
  for(let attempt=0;attempt<100;attempt++){
    if(worker.exitCode!==null) throw new Error("WORKER_PREVIEW_EXITED_BEFORE_READY");
    try{
      const response=await get("/robots.txt",1500);
      if(response.status!==200)throw new Error(`WORKER_ROBOTS_HTTP_${response.status}`);
      const body=await response.text();
      if(!body.includes("Sitemap:"))throw new Error("WORKER_ROBOTS_MISSING_SITEMAP");
      console.log("WORKER_ROBOTS_GET=PASS");
      started=true;
      break;
    }catch(e){
      if(String(e).includes("WORKER_ROBOTS_")) throw e;
      await sleep(500);
    }
  }
  if(!started)throw new Error("WORKER_PREVIEW_START_TIMEOUT");
  const response=await get("/",10000);
  if(response.status!==200)throw new Error(`WORKER_HOME_HTTP_${response.status}`);
  const body=await response.text();
  if(!body.includes("ضاديوم"))throw new Error("WORKER_HOME_MISSING_ARABIC_BRAND");
  console.log("WORKER_HOME_GET=PASS");
  const sitemap=await get("/sitemap.xml",10000);
  if(sitemap.status!==200)throw new Error(`WORKER_SITEMAP_HTTP_${sitemap.status}`);
  const xml=await sitemap.text();
  if(!xml.includes("<urlset"))throw new Error("WORKER_SITEMAP_MISSING_XML");
  console.log("WORKER_SITEMAP_GET=PASS");
  // Public entry and installability on the *compiled* local Worker.
  // No credentials, student data, signup writes, or external providers used.
  const manifestResponse = await get("/manifest.webmanifest", 10000);
  if (manifestResponse.status !== 200) {
    throw new Error(`WORKER_MANIFEST_HTTP_${manifestResponse.status}`);
  }
  const manifest = await manifestResponse.json();
  if (!manifest.name?.includes("ضاديوم") || manifest.lang !== "ar" ||
      manifest.dir !== "rtl" || manifest.start_url !== "/") {
    throw new Error("WORKER_MANIFEST_METADATA_INVALID");
  }
  console.log("WORKER_MANIFEST_GET=PASS");

  const pwaIcon = await get("/pwa/icon-192.png", 10000);
  if (pwaIcon.status !== 200 ||
      !pwaIcon.headers.get("content-type")?.includes("image/png") ||
      (await pwaIcon.arrayBuffer()).byteLength < 128) {
    throw new Error(`WORKER_PWA_ICON_INVALID_${pwaIcon.status}`);
  }
  console.log("WORKER_PWA_ICON_GET=PASS");

  for (const authPage of ["/login", "/signup"]) {
    const authResponse = await get(authPage, 10000);
    if (authResponse.status !== 200) {
      throw new Error(`WORKER_AUTH_PAGE_${authPage.slice(1)}_HTTP_${authResponse.status}`);
    }
    const authHtml = await authResponse.text();
    if (!authHtml.includes("<html") || !authHtml.includes("lang=\"ar\"") ||
        !authHtml.includes('type="password"')) {
      throw new Error(`WORKER_AUTH_PAGE_${authPage.slice(1)}_MISSING_FORM`);
    }
    console.log(`WORKER_AUTH_PAGE_${authPage.slice(1).toUpperCase()}=PASS`);
  }

  // The HTML alone is not enough: at least one actual linked client JS file
  // must be served by the Worker static asset handler.
  const jsAsset = [...body.matchAll(/(?:src|href)="([^"]+\.js(?:\?[^"]*)?)"/g)]
    .map(match => match[1])
    .find(path => path.startsWith("/_next/static/"));
  if (!jsAsset) throw new Error("WORKER_HOME_MISSING_CLIENT_JS");
  const jsResponse = await get(jsAsset, 10000);
  if (jsResponse.status !== 200 ||
      !/javascript/i.test(jsResponse.headers.get("content-type") || "")) {
    throw new Error(`WORKER_CLIENT_JS_HTTP_${jsResponse.status}`);
  }
  if ((await jsResponse.text()).length < 64) {
    throw new Error("WORKER_CLIENT_JS_EMPTY");
  }
  console.log("WORKER_CLIENT_JS_GET=PASS");

  // Live workerd/Cloudflare runtime denies access to private grading APIs
  // before reading the database or attempting any admin operation. Fake
  // public env is intentionally non-routable; all requests are anonymous.
  const unauthenticated = [
    { name:"QUESTION_GRADING", method:"POST", path:"/api/questions/answer", body:{
      questionId:"00000000-0000-4000-8000-000000000001", selectedAnswer:"fake"
    }},
    { name:"ACTIVITY_GRADING", method:"POST", path:"/api/lesson-activities/check", body:{
      activityId:"00000000-0000-4000-8000-000000000001", answer:["__completed__"]
    }},
    { name:"AI_TEST_SUBMIT", method:"POST", path:"/api/ai/assessment/submit", body:{
      assessmentId:"00000000-0000-4000-8000-000000000001",
      sessionId:"00000000-0000-4000-8000-000000000002",answer:0
    }},
    { name:"AI_TEST_NEXT", method:"POST", path:"/api/ai/assessment/next", body:{
      sessionId:"00000000-0000-4000-8000-000000000002",correct:true
    }},
    { name:"AI_TEST_SESSION", method:"POST", path:"/api/ai/assessment/session", body:{
      lessonId:"00000000-0000-4000-8000-000000000001"
    }}
  ];
  for (const check of unauthenticated) {
    const response = await fetch(url+check.path,{
      method:check.method,
      headers:{"content-type":"application/json"},
      body:JSON.stringify(check.body),
      redirect:"manual",
      signal:AbortSignal.timeout(10000)
    });
    const body=await response.text();
    if (response.status!==401) {
      throw new Error(`WORKER_${check.name}_EXPECTED_401_GOT_${response.status}:${body.slice(0,180)}`);
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error(`WORKER_${check.name}_NOT_JSON`);
    }
    if (/service.role|service_role|SUPABASE_SERVICE_ROLE_KEY|correct_answer/i.test(body)) {
      throw new Error(`WORKER_${check.name}_LEAKED_PRIVATE_INTERNALS`);
    }
    console.log(`WORKER_${check.name}_UNAUTH_401=PASS`);
  }
  // Real compiled Worker must fail closed on legacy browser-forged XP.
  // This endpoint is intentionally disabled, even for a forged score=100.
  const forgedArcade = await fetch(url + "/api/games/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lessonId: "00000000-0000-4000-8000-000000000001",
      gameKey: "vocabulary",
      score: 100,
      maxScore: 100,
      xp: 999999,
    }),
    redirect: "manual",
    signal: AbortSignal.timeout(10000),
  });
  const forgedBody = await forgedArcade.json();
  if (forgedArcade.status !== 409 || forgedBody.ok !== false ||
      forgedBody.xp !== 0 || forgedBody.code !== "UNVERIFIED_ARCADE_SCORE") {
    throw new Error("WORKER_LEGACY_GAME_FORGED_XP_NOT_BLOCKED");
  }
  console.log("WORKER_LEGACY_GAME_UNVERIFIED_XP_DENIED=PASS");

  // The real Worker must authenticate before any lesson vocabulary pack
  // can be generated. In particular, no correct_answer leaks on 401.
  const arcadePack = await get(
    "/api/lessons/games?lessonId=00000000-0000-4000-8000-000000000001",10000
  );
  const arcadePackText = await arcadePack.text();
  if (arcadePack.status !== 401 ||
      !arcadePack.headers.get("content-type")?.includes("application/json") ||
      /correct_answer|service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(arcadePackText)) {
    throw new Error(`WORKER_ARCADE_QUESTION_PACK_AUTH_DENIAL_FAILED_${arcadePack.status}`);
  }
  console.log("WORKER_ARCADE_PACK_UNAUTH_401_NO_KEYS=PASS");

  const mastery = await get("/api/lesson-mastery?lessonId=00000000-0000-4000-8000-000000000001",10000);
  if(mastery.status!==401) {
    throw new Error(`WORKER_LESSON_MASTERY_EXPECTED_401_GOT_${mastery.status}`);
  }
  console.log("WORKER_LESSON_MASTERY_UNAUTH_401=PASS");

  // Browser-level, local-only smoke: exercise client-side form hydration
  // at desktop and narrow mobile viewport, without sending any valid signup or login request.
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    for (const device of [
      { name: "DESKTOP", width: 1365, height: 768 },
      { name: "MOBILE", width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({
        viewport: { width: device.width, height: device.height },
        locale: "ar",
      });
      try {
        for (const route of ["/login", "/signup"]) {
          const response = await page.goto(url + route, {
            waitUntil: "domcontentloaded",
            timeout: 25000,
          });
          if (response?.status() !== 200) {
            throw new Error(`WORKER_BROWSER_${device.name}_${route.slice(1)}_HTTP_${response?.status()}`);
          }
          const email = page.locator('input[type="email"]');
          const password = page.locator('input[type="password"]');
          await email.waitFor({ state: "visible", timeout: 12000 });
          await password.waitFor({ state: "visible", timeout: 12000 });
          if (await page.locator("html").getAttribute("dir") !== "rtl" ||
              await page.locator("html").getAttribute("lang") !== "ar") {
            throw new Error(`WORKER_BROWSER_${device.name}_${route.slice(1)}_RTL_INVALID`);
          }
          // A real Chromium fill tests editability (not authentication).
          await email.fill("browser-ci@example.invalid");
          await password.fill("test-only-no-real-login");
          if (await email.inputValue() !== "browser-ci@example.invalid") {
            throw new Error("WORKER_BROWSER_FORM_NOT_EDITABLE");
          }
          if (route === "/signup" && await page.locator("select").count() < 2) {
            throw new Error("WORKER_BROWSER_SIGNUP_MISSING_ROLE_COUNTRY");
          }
          const width = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            viewport: document.documentElement.clientWidth,
          }));
          if (width.scroll > width.viewport + 16) {
            throw new Error(`WORKER_BROWSER_${device.name}_${route.slice(1)}_OVERFLOW`);
          }
          if (route === "/signup") {
            // Prove that the *hydrated React onSubmit handler* executes.
            // Name is deliberately blank (not a native-required field), so
            // the handler shows an inline validation error BEFORE auth/DB calls.
            let authRequests = 0;
            page.on("request", request => {
              if (/\/auth\/v1\/signup|\/api\/auth\//.test(request.url())) {
                authRequests += 1;
              }
            });
            await page.locator('button[type="submit"]').click();
            await page.getByText("أكمل الاسم ونوع الحساب والدولة.", {
              exact: true
            }).waitFor({ state: "visible", timeout: 10000 });
            if (authRequests !== 0) {
              throw new Error("WORKER_BROWSER_SIGNUP_VALIDATION_SENT_AUTH_REQUEST");
            }
            console.log(`WORKER_BROWSER_${device.name}_SIGNUP_REACT_HYDRATION=PASS`);
          }
          console.log(`WORKER_BROWSER_${device.name}_${route.slice(1).toUpperCase()}=PASS`);
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log("WORKER_LOCAL_PREVIEW_RUNTIME=PASS");
}catch(e){
  console.error("WORKER_LOCAL_PREVIEW_RUNTIME=FAIL",String(e));
  console.error("WORKER_PREVIEW_DIAGNOSTICS_LAST_7000",diagnostics);
  process.exitCode=1;
}finally{
  worker.kill("SIGTERM");
}
