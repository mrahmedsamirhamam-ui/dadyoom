/**
 * HTTP contract: five different HTML game stages per mode, 25 per lesson.
 * Verify (1) regular lesson (2) zero-question/vocabulary seed fallback
 * (3) independent country/grade 13 lesson. No session or Plus subscription.
 */
const base = process.env.DADYOOM_BASE_URL || "https://dadyoom.com";
const samples = [
  { id: "e37fc252-1baa-484b-9e49-d1fd2075b840", group: "BH_QUESTION_AND_VOCAB" },
  { id: "e45a8714-823e-446c-8f28-42de4d776a0c", group: "BH_CONTENT_ONLY" },
  { id: "cdd29cbb-6e90-44f2-ba97-79791fc14ea4", group: "MR_GRADE13" },
];
const modes = ["maze", "defender", "catcher", "runner", "guardian"];
for (const sample of samples) {
  const url = base + "/api/lessons/games?lessonId=" + sample.id;
  let data;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("http=" + response.status + " " + (await response.text()).slice(0, 150));
      data = await response.json();
      break;
    } catch (error) {
      if (attempt === 3) throw new Error("GAME_5X5_PRODUCTION_HTTP_FAILED " + sample.group + " " + String(error));
    }
  }
  if (!data?.ok || !data.pack) throw new Error("GAME_5X5_NO_PACK " + sample.group);
  const prompts = [];
  for (const mode of modes) {
    const items = data.pack[mode];
    if (!Array.isArray(items) || items.length !== 5) throw new Error("GAME_5X5_BAD_COUNT " + sample.group + " " + mode);
    if (new Set(items.map(item => item.prompt)).size !== 5) throw new Error("GAME_5X5_REPEATED_PROMPT " + sample.group + " " + mode);
    for (const item of items) {
      if (!item.prompt || !Array.isArray(item.options) ||
        item.options.length < 2 || !item.options.includes(item.answer)) {
        throw new Error("GAME_5X5_INVALID_ANSWER " + sample.group + " " + mode);
      }
      prompts.push(item.prompt);
    }
    console.log("GAME_5X5_MODE=PASS sample=" + sample.group + " mode=" + mode + " count=" + items.length);
  }
  if (new Set(prompts).size !== 25) throw new Error("GAME_5X5_DUPLICATE_BANK sample=" + sample.group);
  console.log("GAME_5X5_PRODUCTION=PASS sample=" + sample.group + " items=" + prompts.length + " source=" + data.source);
}
console.log("GAME_5X5_COUNTRY_AND_FALLBACK=PASS samples=" + samples.length);
