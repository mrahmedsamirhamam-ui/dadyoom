import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const server = readFileSync("app/admin/teachers/page.tsx", "utf8");
const counts = readFileSync("app/admin/teachers/AdminTeacherClassCounts.tsx", "utf8");
const adminLayout = readFileSync("app/admin/layout.tsx", "utf8");

describe("Admin teacher dashboard avoids expensive Cloudflare render queries", () => {
  test("SSR fetches teacher profiles, never 2000 teacher class rows", () => {
    expect(server).toContain('.eq("role", "teacher")');
    expect(server).toContain('.limit(100)');
    expect(server).not.toContain('.from("teacher_classes")');
    expect(server).toContain('AdminTeacherClassCounts teacherIds={teachers.map((teacher) => teacher.id)}');
    expect(server).toContain("TeacherClassCount teacherId={teacher.id}");
    expect(adminLayout).toContain('getDashboardRequestViewer()');
    expect(adminLayout).toContain('!== "admin"');
  });
  test("one client RLS request retrieves active class counts scoped to visible teachers", () => {
    expect(counts).toContain('import { createClient } from "@/lib/supabase/client"');
    expect(counts).toContain('.from("teacher_classes")');
    expect(counts).toContain('.in("teacher_id", ids)');
    expect(counts).toContain('.eq("is_active", true)');
    expect(counts).toContain('.limit(2000)');
    expect(counts).toContain('return () => { active = false; }');
    expect(counts).not.toContain("createAdminClient");
  });
});
