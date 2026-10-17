import { readFileSync } from "node:fs";
const fixture = JSON.parse(readFileSync("data/curriculum-completeness/action-game-22-countries-20261017.json","utf8"));
const base = process.env.DADYOOM_BASE_URL || "https://dadyoom.com";
const modes = ["maze", "defender", "catcher", "runner", "guardian"];
if (fixture.items.length !== 22 || new Set(fixture.items.map(x => x.code)).size !== 22) {
  throw new Error("GAME_22_COUNTRIES_FIXTURE_INCOMPLETE");
}
for (const { code, id } of fixture.items) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(base + "/api/lessons/games?lessonId=" + encodeURIComponent(id), {
      cache: "no-store", signal: controller.signal,
    });
    if (!response.ok) throw new Error("GAME_22_COUNTRY_HTTP_" + code + "=" + response.status);
    const body = await response.json();
    if (!body?.ok || !body.pack) throw new Error("GAME_22_COUNTRY_PACK_MISSING " + code);
    for (const mode of modes) {
      const questions = body.pack[mode];
      if (!Array.isArray(questions) || questions.length !== 5 ||
          new Set(questions.map(x => x.prompt)).size !== 5 ||
          questions.some(q => !q.options.includes(q.answer))) {
        throw new Error("GAME_22_COUNTRY_BROKEN " + code + "/" + mode);
      }
    }
    console.log("GAME_22_COUNTRY=PASS " + code + " modes=5 questions=25");
  } finally {
    clearTimeout(timer);
  }
}
console.log("GAME_22_COUNTRIES_PRODUCTION=PASS count=22");
