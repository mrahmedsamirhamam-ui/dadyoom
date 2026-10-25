import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildVocabularyGamePack } from "../../features/games/build-vocabulary-game-pack";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const realVocabulary = [
  { word: "تعاون", meaning: "مساعدة الآخرين" },
  { word: "تضامن", meaning: "الاتحاد والمساندة" },
  { word: "تفاهم", meaning: "إدراك الرأي" },
];

describe("legacy vocabulary arcade security", () => {
  it("uses distinct authentic vocabulary questions without artificial padding", () => {
    const pack = buildVocabularyGamePack(realVocabulary);
    expect(pack).not.toBeNull();
    expect(pack?.quiz).toHaveLength(3);
    expect(pack?.challenge).toHaveLength(3);
    expect(new Set(pack?.quiz.map((item) => item.prompt)).size).toBe(3);
    for (const item of pack?.quiz ?? []) {
      expect(item.options).toContain(item.answer);
      expect((item.options ?? []).every((meaning) =>
        realVocabulary.some((row) => row.meaning === meaning),
      )).toBe(true);
    }
  });

  it("withholds game packs with insufficient genuine distractors", () => {
    expect(buildVocabularyGamePack([])).toBeNull();
    expect(buildVocabularyGamePack([realVocabulary[0]])).toBeNull();
    expect(buildVocabularyGamePack([
      realVocabulary[0], { word: "اتحاد", meaning: realVocabulary[0].meaning },
    ])).toBeNull();
  });

  it("rejects disguised question key reads or fake title-question fallbacks", () => {
    const route = read("app/api/lessons/games/route.ts");
    const builder = read("features/games/build-vocabulary-game-pack.ts");
    expect(route).not.toContain('.from("questions")');
    expect(route).not.toContain("correct_answer");
    expect(route).not.toContain("edu_lesson_game_packs");
    expect(route.indexOf('.eq("status", "published")')).toBeLessThan(
      route.indexOf('.from("lesson_vocabulary")'),
    );
    expect(builder).not.toContain("takeFive");
    expect(builder).not.toContain("ما عنوان الدرس");
  });

  it("does not pay XP or save client-forged legacy grades", () => {
    const route = read("app/api/games/complete/route.ts");
    const client = read("app/lessons/[id]/games/LessonGamesClient.tsx");
    const trustedAction = read("features/study-play/actions/submitStudyPlay.ts");
    expect(route).toContain("UNVERIFIED_ARCADE_SCORE");
    expect(route).toContain("status: 409");
    expect(route).not.toContain(".insert(");
    expect(route).not.toContain("edu_game_attempts");
    expect(client).toContain("if (!response.ok)");
    expect(client).toContain("نتيجة اللعبة غير معتمدة");
    expect(trustedAction).toMatch(/await admin\.from\("edu_game_attempts"\)\.insert/);
    expect(trustedAction).not.toMatch(/await supabase\.from\("edu_game_attempts"\)\.insert/);
  });
});
