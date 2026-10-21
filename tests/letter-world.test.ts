import { describe, expect, it } from "vitest";
import { ARABIC_LETTERS, ARABIC_VOWELS, getLetterChallengeOptions, letterWithVowel } from "../lib/letter-lab/alphabet";

describe("the interactive Arabic letter world", () => {
  it("contains each of the 28 alphabet letters exactly once", () => {
    expect(ARABIC_LETTERS).toHaveLength(28);
    expect(new Set(ARABIC_LETTERS.map((entry) => entry.char)).size).toBe(28);
    expect(ARABIC_LETTERS[0].char).toBe("ا");
    expect(ARABIC_LETTERS[27].char).toBe("ي");
    for (const item of ARABIC_LETTERS) {
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.word.length).toBeGreaterThan(0);
      expect(item.meaning.length).toBeGreaterThan(0);
    }
  });

  it("supports fatha, damma and kasra without inventing bare-alif consonant sounds", () => {
    expect(ARABIC_VOWELS).toHaveLength(3);
    expect(["أَ", "أُ", "إِ"]).toEqual([0, 1, 2].map((index) => letterWithVowel("ا", index)));
    expect(["شَ", "شُ", "شِ"]).toEqual([0, 1, 2].map((index) => letterWithVowel("ش", index)));
    expect(letterWithVowel("ش", 5)).toBe("ش");
  });

  it("creates three unique challenge choices including the correct letter", () => {
    for (let index = 0; index < ARABIC_LETTERS.length; index++) {
      const options = getLetterChallengeOptions(index);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options).toContain(ARABIC_LETTERS[index].char);
    }
    expect(getLetterChallengeOptions(-1)).toEqual([]);
    expect(getLetterChallengeOptions(28)).toEqual([]);
  });
});
