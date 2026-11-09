import { describe, expect, it } from "vitest";
import {
  QUALITY_AXES, NEXT_REVIEW_STAGE, PUBLIC_REVIEW_BADGE_ENABLED,
  isApprovedOnAllAxes, isValidNextStage, shouldDisplayPublicReviewBadge,
} from "@/lib/lesson-review/model";
describe("lesson review phase 1 safety", () => {
  const approved = QUALITY_AXES.map(({ key }) => ({
    axis: key, state: "approved" as const, reviewer_id: "reviewer-id",
    reviewed_at: "2026-11-09T20:00:00Z", notes: "تم التدقيق",
  }));
  it("requires six human-reviewed quality axes", () => {
    expect(isApprovedOnAllAxes([])).toBe(false);
    expect(isApprovedOnAllAxes(approved.slice(0,5))).toBe(false);
    expect(isApprovedOnAllAxes([{...approved[0],reviewer_id:null},...approved.slice(1)])).toBe(false);
    expect(isApprovedOnAllAxes(approved)).toBe(true);
  });
  it("rejects skipping/reversing stages, including the legacy published state", () => {
    expect(isValidNextStage("published_unreviewed","draft")).toBe(true);
    expect(isValidNextStage("draft","approved")).toBe(false);
    expect(isValidNextStage("published_unreviewed","approved")).toBe(false);
    expect(isValidNextStage("published","approved")).toBe(false);
    expect(Object.entries(NEXT_REVIEW_STAGE)).toHaveLength(6);
  });
  it("never renders visitor badge even when review data is approved", () => {
    expect(PUBLIC_REVIEW_BADGE_ENABLED).toBe(false);
    expect(shouldDisplayPublicReviewBadge("published",approved)).toBe(false);
  });
});
