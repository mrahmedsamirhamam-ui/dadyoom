import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.DADYOOM_E2E_BASE_URL || "https://dadyoom.com";
const id = "e37fc252-1baa-484b-9e49-d1fd2075b840";
const modes = [
  ["متاهة الأبواب", "maze"],
  ["حارس القلعة", "defender"],
  ["صائد البالونات", "catcher"],
  ["سباق المسارات", "runner"],
  ["كنز البطاقات", "guardian"],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(25000);
  const response = await page.goto(base + "/lessons/" + id + "/games", {
    waitUntil: "domcontentloaded", timeout: 60000,
  });
  if (response?.status() !== 200) throw new Error("GAME_UI_HTTP_FAILED " + response?.status());
  for (let m = 0; m < modes.length; m++) {
    const [name, key] = modes[m];
    await page.locator('nav[aria-label="اختر اللعبة"] button').nth(m).click();
    for (let step = 1; step <= 5; step++) {
      const scene = page.locator('section[aria-label="' + name + '"]');
      await scene.getByText("السؤال " + step + " من 5").waitFor({ state: "visible" });
      if (key === "runner") {
        await scene.getByRole("button", { name: /انطلق في المسار المختار/ }).click();
      } else if (key === "guardian") {
        // First tap reveals the HTML memory card. Second tap chooses it.
        await scene.getByRole("button", { name: /اكشف بطاقة/ }).first().click();
        await scene.getByRole("button", { name: /اختر/ }).first().click();
      } else {
        await scene.locator("button").first().click();
      }
      await scene.getByText(/إجابة رائعة!|تعلم من المحاولة/).waitFor({ state: "visible" });
      const next = step === 5 ? "🏆 عرض نتيجة اللعبة" : "المهمة التالية";
      await scene.getByRole("button", { name: new RegExp(next) }).click();
    }
    await page.getByText("أنهيت خمس مراحل!").waitFor({ state: "visible" });
    console.log("GAME_UI_5_ROUNDS=PASS game=" + key);
  }
  await mkdir("artifacts/production-role-qa", { recursive: true });
  await page.screenshot({ path: "artifacts/production-role-qa/games-five-rounds-mobile.png" });
  console.log("GAME_UI_MOBILE_25_ROUNDS=PASS");
} finally {
  await browser.close();
}
