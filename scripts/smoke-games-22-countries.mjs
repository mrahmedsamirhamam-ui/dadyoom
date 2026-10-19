import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync("data/curriculum-completeness/action-game-22-countries-20261017.json", "utf8"));
const base = process.env.DADYOOM_BASE_URL || "https://dadyoom.com";
const modes = ["maze", "defender", "catcher", "runner", "guardian"];
if (fixture.items.length !== 22 || new Set(fixture.items.map((x) => x.code)).size !== 22) {
  throw new Error("GAME_22_COUNTRIES_FIXTURE_INCOMPLETE");
}

async function requestWithTransientRetry(url, country) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      // A broken endpoint, incorrect curriculum ID or invalid JSON must NEVER
      // be masked by retries. Retry only known transient network/server errors.
      if (response.status === 429 || [502, 503, 504].includes(response.status)) {
        if (attempt === 3) throw new Error("GAME_22_COUNTRY_TRANSIENT_HTTP_" + country + "=" + response.status);
        console.warn("GAME_22_COUNTRY_RETRY " + country + " attempt=" + attempt + " http=" + response.status);
      } else {
        if (!response.ok) throw new Error("GAME_22_COUNTRY_HTTP_" + country + "=" + response.status);
        return await response.json();
      }
    } catch (error) {
      const transientNetwork =
        error instanceof TypeError || (error instanceof Error && error.name === "AbortError");
      if (!transientNetwork || attempt === 3) throw error;
      console.warn("GAME_22_COUNTRY_RETRY " + country + " attempt=" + attempt + " network=" + error.name);
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }
  throw new Error("GAME_22_COUNTRY_UNREACHABLE " + country);
}

for (const { code, id } of fixture.items) {
  const body = await requestWithTransientRetry(
    base + "/api/lessons/games?lessonId=" + encodeURIComponent(id),
    code,
  );
  if (!body?.ok || !body.pack) throw new Error("GAME_22_COUNTRY_PACK_MISSING " + code);
  for (const mode of modes) {
    const questions = body.pack[mode];
    if (!Array.isArray(questions) || questions.length !== 5 ||
        new Set(questions.map((x) => x.prompt)).size !== 5 ||
        questions.some((q) => !Array.isArray(q.options) || !q.options.includes(q.answer))) {
      throw new Error("GAME_22_COUNTRY_BROKEN " + code + "/" + mode);
    }
  }
  console.log("GAME_22_COUNTRY=PASS " + code + " modes=5 questions=25");
}
console.log("GAME_22_COUNTRIES_PRODUCTION=PASS count=22");
