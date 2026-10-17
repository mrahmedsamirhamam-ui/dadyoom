import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.DADYOOM_E2E_BASE_URL || "https://dadyoom.com";
const lessonId = "e37fc252-1baa-484b-9e49-d1fd2075b840";
const games = [
  ["حارس العربية — لعبة حركة وتصويب", "maze"],
  ["حماة القلعة", "defender"],
  ["سباق سيارات العربية", "catcher"],
  ["عدّاء الكلمات", "runner"],
  ["مهمة إنقاذ الكنز", "guardian"],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(18000);
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

  for (let m = 0; m < games.length; m++) {
    const [title, key] = games[m];
    await page.locator('nav[aria-label="اختر اللعبة"] button').nth(m).click();
    const arena = page.locator('section[aria-label="' + title + '"]');
    await arena.getByRole("button", { name: /ابدأ المهمة|ابدأ المغامرة/ }).click();
    const canvas = arena.locator("canvas");
    await canvas.waitFor({ state: "visible" });
    for (let step = 1; step <= 5; step++) {
      const question = data.pack[key][step - 1];
      const index = question.options.indexOf(question.answer);
      if (index < 0) throw new Error("GAME_ACTION_INVALID_ANSWER game=" + key + " step=" + step);
      const bounds = await canvas.boundingBox();
      if (!bounds) throw new Error("GAME_ACTION_CANVAS_MISSING game=" + key);
      const scaled = (x, y) => [bounds.x + x / 840 * bounds.width, bounds.y + y / (key === "maze" ? 500 : 480) * bounds.height];
      const count = question.options.length;
      let px, py;
      if (key === "maze") {
        [px, py] = scaled(840 * (index + 1) / (count + 1), 415);
      } else if (key === "defender") {
        [px, py] = scaled(275, 115 + index / (count - 1) * 270);
      } else if (key === "catcher") {
        [px, py] = scaled(840 * (index + 1) / (count + 1), 385);
      } else if (key === "runner") {
        [px, py] = scaled(135, 115 + index / (count - 1) * 270);
      } else {
        const spots = [[130,135],[700,135],[130,330],[700,330],[430,140]];
        [px, py] = scaled(...spots[index]);
      }
      await page.mouse.click(px, py);
      if (step < 5) {
        await arena.getByText(new RegExp("🎯\\s*" + (step + 1) + "/5")).waitFor({
          state: "visible", timeout: key === "runner" ? 13000 : 11000,
        });
      } else {
        await page.getByText("فزت في المغامرة!").waitFor({ state: "visible", timeout: 13000 });
      }
    }
    console.log("GAME_UI_ACTION_CANVAS_5_WAVES=PASS game=" + key);
  }
  await mkdir("artifacts/production-role-qa", { recursive: true });
  await page.screenshot({
    path: "artifacts/production-role-qa/five-html-action-games-mobile.png",
    fullPage: true,
  });
  console.log("GAME_UI_MOBILE_25_ROUNDS=PASS");
} finally {
  await browser.close();
}
