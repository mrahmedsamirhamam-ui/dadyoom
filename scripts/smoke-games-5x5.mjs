/**
 * Production HTTP smoke for five HTML games, checking content not merely 200.
 * Run only after the exact commit has reached dadyoom.com.
 */
const base = process.env.DADYOOM_BASE_URL || "https://dadyoom.com";
const lessonId = "e37fc252-1baa-484b-9e49-d1fd2075b840";
const modeNames = ["maze", "defender", "catcher", "runner", "guardian"];
const url = base + "/api/lessons/games?lessonId=" + lessonId;
let data;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("http=" + response.status);
    data = await response.json();
    break;
  } catch (error) {
    if (attempt === 3) throw new Error("GAME_5X5_PRODUCTION_HTTP_FAILED " + String(error));
  }
}
if (!data?.ok || !data.pack) throw new Error("GAME_5X5_NO_PACK");
const total = [];
for (const mode of modeNames) {
  const items = data.pack[mode];
  if (!Array.isArray(items) || items.length !== 5) throw new Error("GAME_5X5_BAD_COUNT " + mode);
  if (new Set(items.map(item => item.prompt)).size !== 5) throw new Error("GAME_5X5_REPEATED_PROMPT " + mode);
  for (const item of items) {
    if (!item.prompt || !Array.isArray(item.options) || item.options.length < 2 || !item.options.includes(item.answer)) {
      throw new Error("GAME_5X5_INVALID_ANSWER " + mode);
    }
    total.push(item.prompt);
  }
  console.log("GAME_5X5_MODE=PASS " + mode + " count=" + items.length);
}
if (new Set(total).size < 5) throw new Error("GAME_5X5_DUPLICATE_BANK");
console.log("GAME_5X5_PRODUCTION=PASS lesson=" + lessonId + " items=" + total.length +
  " source=" + (data.source || "unknown"));
