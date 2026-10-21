import { describe, expect, it } from "vitest";
import {
  getLetterLabMastery,
  isCorrectLetterSequence,
  LETTER_LAB_ACTIVITIES,
  makeLetterTiles,
} from "@/lib/letter-lab/activities";

describe("Letter Lab vocabulary activity", () => {
  it("has three levels of three complete activities", () => {
    for (const activities of Object.values(LETTER_LAB_ACTIVITIES)) {
      expect(activities).toHaveLength(3);
      for (const activity of activities) {
        expect(activity.initialChoices).toContain(Array.from(activity.word)[0]);
        expect(activity.meaningChoices).toContain(activity.correctMeaning);
        expect(activity.example).toContain(activity.word.slice(0, 2));
      }
    }
  });

  it("preserves duplicate Arabic letters with stable tile identities", () => {
    const activity = LETTER_LAB_ACTIVITIES.challenge[1];
    const tiles = makeLetterTiles(activity);
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(tiles.length);
    expect(tiles.length).toBe(Array.from(activity.word).length + activity.extraLetters.length);
    expect(isCorrectLetterSequence(Array.from(activity.word), activity.word)).toBe(true);
    expect(isCorrectLetterSequence(Array.from(activity.word).reverse(), activity.word)).toBe(false);
  });

  it("awards a descriptive independent-practice score without claiming a curriculum grade", () => {
    expect(getLetterLabMastery(0, 0)).toContain("ابدأ");
    expect(getLetterLabMastery(8, 9)).toContain("إتقان");
    expect(getLetterLabMastery(5, 9)).toContain("تقدم");
    expect(getLetterLabMastery(1, 9)).toContain("حاول");
  });
});
