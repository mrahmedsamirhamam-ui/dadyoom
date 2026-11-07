import { describe, expect, it } from "vitest";
import { APP_ROLES, hasAnyRole, normalizeAppRole } from "../../lib/auth/roles";

describe("Dadyoom role contract", () => {
  it("defines exactly six supported roles", () => {
    expect(APP_ROLES).toEqual([
      "STUDENT", "TEACHER", "PARENT",
      "SCHOOL_ADMIN", "SUPER_ADMIN", "MINISTRY_ADMIN",
    ]);
  });

  it("normalizes historical lowercase names without granting legacy admin", () => {
    expect(normalizeAppRole("student")).toBe("STUDENT");
    expect(normalizeAppRole("school_admin")).toBe("SCHOOL_ADMIN");
    expect(normalizeAppRole("admin")).toBeNull();
    expect(normalizeAppRole("")).toBeNull();
    expect(normalizeAppRole(null)).toBeNull();
  });

  it("denies absent roles and enforces explicit allow lists", () => {
    expect(hasAnyRole(null, ["STUDENT"])).toBe(false);
    expect(hasAnyRole("STUDENT", ["SCHOOL_ADMIN"])).toBe(false);
    expect(hasAnyRole("SCHOOL_ADMIN", ["SCHOOL_ADMIN"])).toBe(true);
    expect(hasAnyRole("MINISTRY_ADMIN", ["SUPER_ADMIN"])).toBe(false);
  });
});
