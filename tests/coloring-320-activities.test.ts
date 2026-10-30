import { describe, expect, it } from "vitest";
import {COLORING_ACTIVITIES, findColoringActivity, getActivityChoices, activityHref} from "@/lib/coloring/activities";
describe("Dadyoom 320 QR activity routes", () => {
  it("includes exactly 160 uniquely addressable activities per volume", () => {
    expect(COLORING_ACTIVITIES).toHaveLength(320);
    expect(new Set(COLORING_ACTIVITIES.map(activityHref)).size).toBe(320);
    for(const volume of [1,2]) expect(COLORING_ACTIVITIES.filter(a=>a.volume===volume)).toHaveLength(160);
  });
  it("returns 404 target for invalid page or path and has all required educational content", () => {
    expect(findColoringActivity("volume-1","page-001")?.title).toBe("أ - أرنب");
    expect(findColoringActivity("volume-3","page-001")).toBeUndefined();
    expect(findColoringActivity("volume-1","page-000")).toBeUndefined();
    expect(findColoringActivity("volume-2","page-161")).toBeUndefined();
    for(const a of COLORING_ACTIVITIES) {
      expect(a.title.trim().length).toBeGreaterThan(0);
      expect(a.instruction.trim().length).toBeGreaterThan(15);
      expect(a.question.trim().length).toBeGreaterThan(5);
      expect(getActivityChoices(a)).toHaveLength(3);
      expect(new Set(getActivityChoices(a)).size).toBe(3);
      expect(getActivityChoices(a)).toContain(a.word);
    }
  });
});
