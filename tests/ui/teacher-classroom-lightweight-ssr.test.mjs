import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const server = readFileSync("app/(dashboard)/teacher/classroom/page.tsx","utf8");
const browser = readFileSync("app/(dashboard)/teacher/classroom/TeacherClassroomClient.tsx","utf8");

describe("Teacher classroom stays responsive without Cloudflare SSR network fan-out",()=>{
  test("only loads authenticated teacher classes and roster on the server",()=>{
    expect(server).toContain('supabase.auth.getUser()');
    expect(server).toContain('.from("teacher_classes")');
    expect(server).toContain('.eq("teacher_id", user.id)');
    expect(server).toContain('.from("teacher_class_students")');
    expect(server).toContain('.from("profiles")');
    for(const table of ["edu_conversations","edu_messages","edu_assignments","edu_rewards","lessons"]){
      expect(server).not.toContain(`.from("${table}")`);
    }
  });
  test("browser gets secondary reads via actual RLS session and refreshes after actions",()=>{
    expect(browser).toContain('createClient } from "@/lib/supabase/client"');
    for(const table of ["lessons","edu_conversations","edu_assignments","edu_messages"]){
      expect(browser).toContain(`.from("${table}")`);
    }
    expect(browser).toContain('setReloadVersion(previous => previous + 1)');
    expect(browser).toContain("if (!active) return;");
    expect(browser).toContain("جارٍ تحميل الرسائل والمهام والدروس المنشورة");
  });
});
