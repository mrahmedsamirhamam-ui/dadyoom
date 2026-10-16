import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync("supabase/migrations/20261016224000_dadyoom_admin_lesson_source_audit_v1.sql","utf8");
const page = readFileSync("app/admin/curriculum/coverage/countries/page.tsx","utf8");
const catalog = readFileSync("app/admin/curriculum/page.tsx","utf8");

describe("22-country source quality audit runs as secure, read-only SQL aggregate",()=>{
  test("rpc only executes for authenticated admin with invoker RLS",()=>{
    expect(sql).toContain("SECURITY INVOKER");
    expect(sql).toContain("SELECT auth.uid()");
    expect(sql).toContain("lower(btrim(p.role)) = 'admin'");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.dadyoom_admin_lesson_source_audit_v1() FROM anon");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.dadyoom_admin_lesson_source_audit_v1() TO authenticated");
    expect(sql).not.toMatch(/\bUPDATE\b|\bDELETE\b|\bTRUNCATE\b/u);
  });
  test("admin-only page queries one source aggregate rather than thousands of lessons",()=>{
    expect(page).toContain('db.rpc("dadyoom_admin_lesson_source_audit_v1")');
    expect(page).not.toContain('.from("lessons")');
    expect(page).toContain("published_missing_pages");
    expect(page).toContain("published_generic_intro");
    expect(page).toContain("لا يعني اعتماد");
    expect(catalog).toContain('/admin/curriculum/coverage/countries');
  });
});
