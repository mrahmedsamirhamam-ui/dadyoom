import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(),
  "scripts/security-assessment-permissions-audit.sql"), "utf8");
const queries = sql.replace(/--[^\n]*/g, "").replace(/\x27(?:\x27\x27|[^\x27])*\x27/g, "\x27\x27");

describe("assessment permissions audit is safe and complete", () => {
  it("cannot modify production state", () => {
    expect(queries).not.toMatch(/\b(REVOKE|GRANT|ALTER|DROP|CREATE|UPDATE|INSERT|DELETE|TRUNCATE|SET\s+ROLE|SECURITY\s+DEFINER)\b/i);
    expect(queries).toMatch(/SELECT\s+c\.table_name/);
  });
  it("checks secrets and forged grading paths without extracting stored answers", () => {
    for (const table of ["questions","lesson_activities","question_attempts",
      "lesson_activity_attempts","student_lesson_progress","lesson_mastery"]) {
      expect(sql).toContain("'" + table + "'");
    }
    for (const key of ["correct_answer","answer","options","dadyoom_student_questions","ai_assessments"]) {
      expect(sql).toContain("'" + key + "'");
    }
    expect(queries).not.toMatch(/SELECT\s+\*\s+FROM\s+public\.(questions|lesson_activities)\b/i);
    expect(sql).toContain("has_column_privilege");
    expect(sql).toContain("has_table_privilege");
    expect(sql).toContain("has_any_column_privilege");
  });
  it("detects residual INSERT/UPDATE column grants after any table-level REVOKE", () => {
    expect(sql).toContain("has_any_column_privilege(roles.role_name");
    expect(sql).toContain("may_insert_some_column");
    expect(sql).toContain("may_update_some_column");
    expect(sql).toContain("may_insert_table");
    expect(sql).toContain("may_update_table");
    // Both low-trust roles and all six grading-related tables must be checked.
    expect(sql).toContain("('anon'), ('authenticated')");
    expect(sql).toContain("assessment_session_answers");
    expect(queries).not.toMatch(/\b(?:REVOKE|GRANT|ALTER|DROP|CREATE|UPDATE|INSERT|DELETE|TRUNCATE)\s+(?:TABLE|ON|INTO|FROM|public\.)/i);
  });
  it("covers legacy score/progress row and column permissions without reading a student's grade",()=>{
    expect(sql).toContain("-- 8. Legacy and current learner progress");
    for(const name of ["student_progress","lesson_progress","student_lesson_progress","lesson_mastery"]){
      expect(sql).toContain("'"+name+"'");
    }
    for(const name of ["best_score","last_score","progress_percent","xp","completed"]){
      expect(sql).toContain("'"+name+"'");
    }
    expect(sql).toContain("grade_column_update");
    expect(sql).toContain("has_any_column_privilege(r.role_name");
    expect(sql).toContain("c.relrowsecurity");
    expect(queries).not.toMatch(/SELECT\s+.*\b(?:user_id|student_id|correct_answer)\b\s+FROM\s+public\./i);
  });
  it("surfaces security invoker dependency and RLS + RPC state", () => {
    expect(sql).toContain("security_invoker=true");
    expect(sql).toContain("pg_policies");
    expect(sql).toContain("pg_proc");
    expect(sql).toContain("pg_class");
    expect(sql).toContain("get_lesson_page_bundle");
  });
  it("inventories privileged public routine signatures and role grants without reading bodies", () => {
    expect(sql).toContain("pg_get_function_identity_arguments");
    expect(sql).toContain("p.prosecdef");
    expect(sql).toContain("has_function_privilege('anon', p.oid, 'EXECUTE')");
    expect(sql).toContain("has_function_privilege('authenticated', p.oid, 'EXECUTE')");
    expect(queries).not.toMatch(/\bpg_get_functiondef\b|\bprosrc\b/i);
  });

});
