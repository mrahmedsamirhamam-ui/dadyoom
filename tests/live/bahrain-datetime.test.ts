import { describe, expect, it } from "vitest";
import { parseBahrainDateTimeLocal } from "../../lib/live/bahrain-datetime";

describe("Dadyoom live events use Bahrain wall time", () => {
  it("converts to UTC consistently", () => {
    expect(parseBahrainDateTimeLocal("2026-10-17T09:30")?.toISOString()).toBe("2026-10-17T06:30:00.000Z");
    expect(parseBahrainDateTimeLocal("2026-12-31T23:59")?.toISOString()).toBe("2026-12-31T20:59:00.000Z");
  });
  it("rejects invalid dates and non-local time formats", () => {
    for (const value of ["", "2026-02-30T10:00", "2026-13-01T10:00", "2026-10-17T26:10", "2026-10-17T09:30Z"]) {
      expect(parseBahrainDateTimeLocal(value)).toBeNull();
    }
  });
});
