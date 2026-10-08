import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const data = JSON.parse(
  readFileSync(
    new URL("../../data/curriculum-completeness/bahrain-grade1-s1-original-learning-support-2026-2027.json", import.meta.url),
    "utf8",
  ),
);

test("all 18 grade-one first-semester book lessons have original support and review disclosure", () => {
  expect(data.country).toBe("BH");
  expect(data.academicYear).toBe("2026-2027");
  expect(data.status).toBe("ORIGINAL_LEARNING_SUPPORT_REQUIRES_EDITORIAL_REVIEW");
  expect(data.lessons).toHaveLength(18);
  expect(new Set(data.lessons.map(row => row.slug)).size).toBe(18);
  for (const unit of [1, 2, 3]) {
    expect(data.lessons.filter(row => row.slug.startsWith(`bh-2026-g1-s1-u${unit}-`))).toHaveLength(6);
  }
  for (const row of data.lessons) {
    expect(row.content.length).toBeGreaterThanOrEqual(650);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content).toContain("إضافة تعليمية أصلية من ضاديوم");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.sourceStatus).not.toBe("COMPLETE_BOOK");
  }
});

test("every letter exercise has two correct choices and a matching answer key", () => {
  const letters = data.lessons.filter(row => row.type === "letter");
  expect(letters).toHaveLength(12);
  for (const row of letters) {
    const prompt = row.content.match(/المستوى الثاني: ضع دائرة حول الكلمتين اللتين تحويان «([^»]+)» من «([^»]+)»/u);
    const answer = row.content.match(/\(ب\) «([^»]+)»\./u);
    expect(prompt, row.slug).not.toBeNull();
    expect(answer, row.slug).not.toBeNull();
    expect(prompt[1]).toBe(row.letter);
    const words = prompt[2].split(" / ");
    expect(words, row.slug).toHaveLength(3);
    expect(words.filter(word => word.includes(row.letter)), row.slug).toHaveLength(2);
    const absent = words.filter(word => !word.includes(row.letter));
    expect(absent, row.slug).toHaveLength(1);
    expect(answer[1], row.slug).toBe(absent[0]);
  }
  expect(data.lessons.filter(row => row.type === "review")).toHaveLength(3);
  expect(data.lessons.filter(row => row.type === "song")).toHaveLength(3);
});
