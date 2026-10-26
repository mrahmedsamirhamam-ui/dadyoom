import { describe, expect, it } from "vitest";
import { hasBoundLesson, mayUseLocalAssistant } from "../lib/mobile/assistant-fallback";

describe("Dadyoom assistant mobile offline policy", () => {
  const ordinary = { mode: "explain" };
  const bound = { mode: "explain", lessonId: "123e4567-e89b-12d3-a456-426614174000" };

  it("allows device-local support for ordinary queries on recoverable errors", () => {
    for (const status of [0, 408, 429, 500, 503, 504]) {
      expect(mayUseLocalAssistant(true, ordinary, status)).toBe(true);
    }
  });

  it("never bypasses login, permission or invalid-input responses", () => {
    for (const status of [400, 401, 403, 404, 413, 422]) {
      expect(mayUseLocalAssistant(true, ordinary, status)).toBe(false);
    }
  });

  it("never implies that an offline device checked a published lesson", () => {
    expect(hasBoundLesson(bound)).toBe(true);
    expect(hasBoundLesson(ordinary)).toBe(false);
    expect(mayUseLocalAssistant(true, bound)).toBe(false);
    expect(mayUseLocalAssistant(true, bound, 429)).toBe(false);
    expect(mayUseLocalAssistant(true, bound, 503)).toBe(false);
    expect(mayUseLocalAssistant(true, ordinary)).toBe(true);
    expect(mayUseLocalAssistant(false, ordinary, 503)).toBe(false);
  });
});
