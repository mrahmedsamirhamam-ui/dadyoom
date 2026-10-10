import { describe, expect, it } from "vitest";
import { extractBahrainPlanYear } from "../../lib/curriculum/source-plan-year";

describe("Bahrain official plan edition provenance", () => {
  it("distinguishes archived semester-two distribution plan from 2026–2027", () => {
    expect(extractBahrainPlanYear("BH", "https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf")).toBe("2025-2026");
    expect(extractBahrainPlanYear("bh", "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf")).toBe("2026-2027");
  });
  it("never infers the term edition from unrelated URLs or other countries", () => {
    expect(extractBahrainPlanYear("BH", "https://edunet.bh/manual/books2026/books1.pdf")).toBeNull();
    expect(extractBahrainPlanYear("PS", "https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf")).toBeNull();
    expect(extractBahrainPlanYear("BH", null)).toBeNull();
  });
});
