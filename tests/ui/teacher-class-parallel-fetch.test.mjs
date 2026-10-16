import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const classPage = readFileSync("app/(dashboard)/teacher/classes/[id]/page.tsx", "utf8");
const studentPage = readFileSync("app/(dashboard)/teacher/classes/[id]/students/[studentId]/page.tsx", "utf8");

describe("teacher classroom SSR availability and authorization", () => {
  test.each([
    ["class", classPage],
    ["student", studentPage],
  ])("%s detail fetches RLS class and authorized roster concurrently", (_, source) => {
    expect(source).toContain("await supabase.auth.getUser()");
    expect(source).toContain("await Promise.all([");
    expect(source).toContain('.from("teacher_classes")');
    expect(source).toContain('.rpc("get_teacher_class_roster", { p_class_id: id })');
    expect(source).toContain("if (classError)");
    expect(source).toContain("if (!classData)");
    expect(source).toContain("notFound()");
    expect(source).toContain("if (rosterError)");
    expect(source.indexOf("await supabase.auth.getUser()"))
      .toBeLessThan(source.indexOf("await Promise.all(["));
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("createAdminClient");
  });

  test("student detail limits the displayed record to the authorized roster", () => {
    expect(studentPage).toContain("roster.find(");
    expect(studentPage).toContain("row.student_id ===");
    expect(studentPage).toContain("studentId");
    expect(studentPage).toContain("if (!student)");
  });
});
