import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const create = read("supabase/migrations/20261022150911_create_dadyoom_student_safe_questions_view.sql");
const lock = read("supabase/migrations/20261022151106_restrict_dadyoom_student_questions_view_to_select_only.sql");
const quiz = read("app/quiz/[id]/page.tsx");

describe("published student questions have a separate read-only DB surface", () => {
  it("uses invoker RLS and limits the view to published lessons", () => {
    expect(create).toMatch(/security_invoker\s*=\s*true/);
    expect(create).toContain("JOIN public.lessons l ON l.id = q.lesson_id");
    expect(create).toContain("l.status = 'published'");
  });

  it("projects no answer keys, explanations or unknown nested option fields", () => {
    expect(create).toContain("jsonb_build_object('id', option_row.opt ->> 'id', 'text', option_row.opt ->> 'text')");
    const projection = create.slice(create.indexOf("AS\nSELECT"),create.indexOf("FROM public.questions q"));
    expect(projection).not.toMatch(/q\.correct_answer\b/);
    expect(projection).not.toMatch(/q\.explanation\b/);
    expect(projection).not.toContain("q.options AS options");
  });

  it("revokes direct grants created by Supabase on new views", () => {
    expect(lock).toMatch(/REVOKE ALL ON TABLE public\.dadyoom_student_questions FROM anon, authenticated/);
    expect(lock).toMatch(/GRANT SELECT ON TABLE public\.dadyoom_student_questions TO anon, authenticated/);
    expect(lock).not.toMatch(/GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\b/);
  });

  it("quiz reads questions from the student view and not the answer-key table", () => {
    expect(quiz).toContain('.from("dadyoom_student_questions")');
    expect(quiz).not.toContain('.from("questions")');
    expect(quiz).not.toContain("correct_answer");
  });
});
