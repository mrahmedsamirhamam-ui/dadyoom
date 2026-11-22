import {describe,it,expect} from "vitest";
import {safeRate,unavailableGrowthMetrics} from "@/lib/growth/metrics";

describe("growth metrics must not invent missing data",()=>{
  it("uses null when no reliable cohort denominator exists",()=>{
    expect(safeRate(0,0)).toBeNull();
    expect(safeRate(null,20)).toBeNull();
    expect(safeRate(8,null)).toBeNull();
  });
  it("reports an exact rate only from known inputs",()=>{
    expect(safeRate(4,10)).toBe(40);
  });
  it("keeps retention and 3-session North Star unknown before instrumentation",()=>{
    expect(unavailableGrowthMetrics.northStarWeekly).toBeNull();
    expect(unavailableGrowthMetrics.retentionD30).toBeNull();
  });
});
