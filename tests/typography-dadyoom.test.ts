import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("Dadyoom global Arabic typography", () => {
  it("chooses Cairo for headings, Tajawal for UI and Noto Naskh for extended reading", () => {
    expect(styles).toContain('--font-arabic-kufi: "Tajawal"');
    expect(styles).toContain('--font-arabic-display: "Cairo"');
    expect(styles).toContain('--font-arabic-naskh: "Noto Naskh Arabic"');
    expect(styles).toContain('--font-heading: var(--font-arabic-display)');
    expect(styles).toContain('font-family: var(--font-arabic-display)');
  });

  it("declares each typography token once and does not retain the conflicting IBM Plex override", () => {
    for (const token of ["--font-arabic-kufi:", "--font-arabic-display:", "--font-arabic-naskh:"]) {
      expect(styles.split(token)).toHaveLength(2);
    }
    expect(styles).not.toContain('"IBM Plex Sans Arabic"');
  });

  it("loads a fallback-friendly stylesheet and readable lesson text without modifying grading", () => {
    expect(styles).toMatch(/fonts\.googleapis\.com\/css2\?family=Cairo/);
    expect(styles).toContain("display=swap");
    expect(styles).toContain(".dadyoom-learning-content {");
    expect(styles).toContain("max-width: 72ch");
    expect(styles).toContain("font-family: var(--font-arabic-naskh)");
    expect(styles).toContain("font-size: clamp(");
    expect(styles).toContain("button, input, select, textarea, option");
    expect(styles).toContain('font-family: inherit');
  });
});
