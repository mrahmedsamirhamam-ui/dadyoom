import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.DADYOOM_E2E_BASE_URL || "https://dadyoom.com";
const lessonId = "e37fc252-1baa-484b-9e49-d1fd2075b840";
const games = [
  ["حارس العربية — أكشن", "maze"],
  ["حارس القلعة", "defender"],
  ["صائد البالونات", "catcher"],
  ["سباق المسارات", "runner"],
  ["كنز البطاقات", "guardian"],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(26000);
  const response = await page.goto(base + "/lessons/" + lessonId + "/games", {
    waitUntil: "domcontentloaded", timeout: 60000,
  });
  if (response?.status() !== 200) throw new Error("GAME_UI_HTTP_FAILED " + response?.status());
  const data = await page.evaluate(async id => {
    const response = await fetch("/api/lessons/games?lessonId=" + encodeURIComponent(id));
    return await response.json();
  }, lessonId);
  if (!data?.ok || !data.pack?.maze || data.pack.maze.length !== 5) {
    throw new Error("GAME_ACTION_PACK_MISSING");
  }

  // Real canvas action game: use current correct answer to align the ship,
  // then launch a projectile and await the next wave (not an HTML quiz click).
  await page.locator('nav[aria-label="اختر اللعبة"] button').first().click();
  const arena = page.locator('section[aria-label="حارس العربية — لعبة حركة وتصويب"]');
  await arena.getByRole("button", { name: "ابدأ المهمة" }).click();
  const canvas = arena.locator("canvas");
  for (let step = 1; step <= 5; step++) {
    const question = data.pack.maze[step - 1];
    const index = question.options.indexOf(question.answer);
    if (index < 0) throw new Error("GAME_ACTION_INVALID_ANSWER step=" + step);
    const bounds = await canvas.boundingBox();
    if (!bounds) throw new Error("GAME_ACTION_CANVAS_MISSING");
    const targetX = 840 * (index + 1) / (question.options.length + 1);
    // Pointerdown on canvas moves the ship and fires a real vertical laser.
    await page.mouse.click(bounds.x + (targetX / 840) * bounds.width, bounds.y + bounds.height * 0.83);
    if (step < 5) {
      await arena.getByText(new RegExp("🎯 " + (step + 1) + "/5")).waitFor({ state: "visible", timeout: 12000 });
    } else {
      await page.getByText("أنهيت خمس مراحل!").waitFor({ state: "visible", timeout: 12000 });
    }
  }
  console.log("GAME_UI_ACTION_CANVAS_5_WAVES=PASS");

  // Retain the existing four game modes until their own action engines replace them.
  for (let m = 1; m < games.length; m++) {
    const [name, key] = games[m];
    await page.locator('nav[aria-label="اختر اللعبة"] button').nth(m).click();
    for (let step = 1; step <= 5; step++) {
      const scene = page.locator('section[aria-label="' + name + '"]');
      await scene.getByText("السؤال " + step + " من 5").waitFor({ state: "visible" });
      if (key === "runner") {
        await scene.getByRole("button", { name: /انطلق في المسار المختار/ }).click();
      } else if (key === "guardian") {
        await scene.getByRole("button", { name: /اكشف بطاقة/ }).first().click();
        await scene.getByRole("button", { name: /اختر/ }).first().click();
      } else {
        await scene.locator("button").first().click();
      }
      await scene.getByText(/إجابة رائعة!|تعلم من المحاولة/).waitFor({ state: "visible" });
      const next = step === 5 ? "عرض نتيجة اللعبة" : "المهمة التالية";
      await scene.getByRole("button", { name: new RegExp(next) }).click();
    }
    await page.getByText("أنهيت خمس مراحل!").waitFor({ state: "visible" });
    console.log("GAME_UI_5_ROUNDS=PASS game=" + key);
  }
  await mkdir("artifacts/production-role-qa", { recursive: true });
  await page.screenshot({
    path: "artifacts/production-role-qa/games-five-rounds-mobile.png", fullPage: true,
  });
  console.log("GAME_UI_MOBILE_25_ROUNDS=PASS");
} finally {
  await browser.close();
}
