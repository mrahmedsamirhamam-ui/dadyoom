import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

// Regression guard for Cloudflare SSR resource regressions. The parent layouts
// already request one cached, verified identity/profile per request.
const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("request-local auth reuse for authenticated portals", () => {
  it("teacher marketplace reuses auth and still checks stored role", () => {
    const source = read("app/(dashboard)/teacher/marketplace/page.tsx");
    expect(source).toContain("getDashboardRequestViewer()");
    expect(source).not.toContain("supabase.auth.getUser()");
    expect(source).not.toContain("createClient()");
    expect(source).toContain('role !== "teacher" && role !== "admin"');
    expect(source).toContain('.eq("teacher_id", user.id)');
  });

  it("admin layout retains a strict admin check", () => {
    const source = read("app/admin/layout.tsx");
    expect(source).toContain("getDashboardRequestViewer()");
    expect(source).not.toContain("supabase.auth.getUser()");
    expect(source).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
    expect(source).toContain('redirect("/login")');
    expect(source).toContain('redirect("/")');
  });

  it("cached viewer verifies identity server-side within each request", () => {
    const source = read("lib/auth/request-viewer.ts");
    expect(source).toContain('import { cache } from "react"');
    expect(source).toContain("cache(async () =>");
    expect(source).toContain("supabase.auth.getUser()");
    expect(source).toContain('.from("profiles")');
    expect(source).toContain(".eq(\"id\", user.id)");
  });
});
