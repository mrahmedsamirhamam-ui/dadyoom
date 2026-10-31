import { describe, expect, it } from "vitest";
import pilot from "@/data/quality/coloring-pedagogical-rebuild-pilot-20261030.json";

/** These checks confirm only structural editorial consistency, not real learning outcomes. */
describe("Dadyoom coloring pilot pedagogical structure", () => {
  it("keeps both old books blocked and this product not for retail", () => {
    expect(pilot.metadata.status).toBe("PILOT_NOT_FOR_RETAIL");
    expect(pilot.metadata.oldBooksApproved).toBe(false);
    expect(pilot.metadata.noPageNumbersOnCovers).toBe(true);
    expect(pilot.metadata.author).toBe("أحمد سمير حمام");
  });

  it.each(["literacy", "life_skills"] as const)(
    "includes 18 individually assessable activities for %s",
    (book) => {
      const activities = pilot[book];
      expect(activities).toHaveLength(18);
      expect(new Set(activities.map((item) => item.title)).size).toBe(18);
      expect(new Set(activities.map((item) => item.objective)).size).toBe(18);
      expect(new Set(activities.map((item) => item.check)).size).toBe(18);
      for (const item of activities) {
        expect(item.title.trim().length).toBeGreaterThan(8);
        expect(item.objective.trim().length).toBeGreaterThan(15);
        expect(item.question.trim().length).toBeGreaterThan(15);
        expect(item.check.trim().length).toBeGreaterThan(15);
        if (item.mode === "choose") expect(item.choices?.length).toBe(3);
        if (item.mode === "motor") expect(item.path).toBeTruthy();
        if (item.mode === "observe") expect(item.image).toBeTruthy();
      }
    }
  );
});
