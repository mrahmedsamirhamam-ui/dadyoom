import { describe, expect, it } from "vitest";
import { ANCHOR_ASSESSMENT, COMMON_GOAL, DIAGNOSTIC, MASTERY_THRESHOLD, PATHS, PATH_ORDER, recommendPath, scoreChoices, suggestChange } from "@/lib/adaptive-lessons/hal";

describe("Original grade 7 Arabic الحال adaptive lesson",()=>{
  it("shares one goal and one mastery assessment among 3 learning routes",()=>{
    expect(PATH_ORDER).toEqual(["start","progress","challenge"]);
    expect(COMMON_GOAL).toContain("الحال");
    expect(MASTERY_THRESHOLD).toBe(0.8);
    expect(ANCHOR_ASSESSMENT).toHaveLength(5);
    expect(DIAGNOSTIC).toHaveLength(4);
    for(const route of Object.values(PATHS)){
      expect(route.practice.length).toBeGreaterThanOrEqual(3);
      expect(route.hints).toHaveLength(3);
      expect(route.examples.length).toBeGreaterThan(0);
      for(const question of route.practice) expect(question.options[question.correctIndex]).toBeDefined();
    }
  });
  it("recommends per-goal routes and never needs a permanent learner label",()=>{
    const answers=Object.fromEntries(DIAGNOSTIC.map(q=>[q.id,q.correctIndex]));
    expect(recommendPath(answers).path).toBe("challenge");
    expect(recommendPath(answers,1).path).toBe("progress");
    expect(recommendPath({}).path).toBe("start");
    expect(recommendPath({d1:2,d2:0}).path).toBe("progress");
  });
  it("does not grant mastery for blank or below-threshold work",()=>{
    expect(scoreChoices(ANCHOR_ASSESSMENT,{}).passed).toBe(false);
    const all=Object.fromEntries(ANCHOR_ASSESSMENT.map(q=>[q.id,q.correctIndex]));
    expect(scoreChoices(ANCHOR_ASSESSMENT,all).passed).toBe(true);
    all[ANCHOR_ASSESSMENT[0].id]=-1;
    expect(scoreChoices(ANCHOR_ASSESSMENT,all).passed).toBe(true);
    all[ANCHOR_ASSESSMENT[1].id]=-1;
    expect(scoreChoices(ANCHOR_ASSESSMENT,all).passed).toBe(false);
  });
  it("only suggests, never silently forces, route changes",()=>{
    expect(suggestChange("progress",0,3)).toBe("start");
    expect(suggestChange("start",0,3)).toBe("start");
    expect(suggestChange("start",2,0)).toBe("progress");
    expect(suggestChange("challenge",2,0)).toBe("challenge");
  });
});
