import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

const st = vi.hoisted(() => ({
  user: { id: "student-1" } as { id: string } | null,
  lesson: null as null | {
    id: string; title: string; summary: string | null; content: string | null;
  },
  dbReads: vi.fn(),
  billing: vi.fn(),
  agent: vi.fn(),
  agentJson: vi.fn(),
  adminFactory: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: st.user }, error: null }) },
    from: (table: string) => {
      st.dbReads(table);
      if (table !== "lessons") throw new Error("unexpected student DB query");
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: st.lesson, error: null }),
      };
      return query;
    },
  }),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: st.adminFactory }));
vi.mock("@/lib/billing/access", () => ({ consumeFeature: st.billing }));
vi.mock("@/lib/ai/agents", () => ({
  runAgent: st.agent,
  runAgentJson: st.agentJson,
}));

import { POST } from "@/app/api/lessons/study/route";

const boilerplate =
  "يتناول هذا الدرس موضوع «الدّرس الخامس». " +
  "يبدأ التعلم بتهيئة قصيرة، ثم قراءة أو مناقشة الموضوع، " +
  "واستخراج الفكرة الرئيسة، ثم تطبيقها في نشاط شفهي وكتابي مناسب لمستوى الطالب.";

beforeEach(() => {
  vi.clearAllMocks();
  st.user = { id: "student-1" };
  st.lesson = {
    id: "11111111-1111-4111-8111-111111111111",
    title: "الدّرس الخامس",
    summary: "هذه مسودة ملخص لم تراجع بعد.",
    content: boilerplate,
  };
  st.billing.mockImplementation(() => { throw new Error("NO_BILLING_ALLOWED"); });
  st.agent.mockImplementation(() => { throw new Error("NO_AI_ALLOWED"); });
  st.agentJson.mockImplementation(() => { throw new Error("NO_AI_ALLOWED"); });
  st.adminFactory.mockImplementation(() => { throw new Error("NO_ADMIN_ALLOWED"); });
});

function request(task: string, refresh = false): Request {
  return new Request("https://dadyoom.example/api/lessons/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId: st.lesson?.id, task, refresh, question: "كيف ألخصه؟" }),
  });
}

describe("real HTTP study route refuses generic non-teaching lesson content", () => {
  it.each([
    "summary", "slides", "flashcards", "study_guide", "concept_map",
    "video_storyboard", "notebook_answer", "custom_summary", "custom_slides",
  ])("rejects %s before AI, billing, cached data and background enrich", async task => {
    const response = await POST(request(task));
    expect(response.status).toBe(409);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject({ code: "LESSON_CONTENT_REVIEW_REQUIRED" });
    expect(st.dbReads).toHaveBeenCalledWith("lessons");
    expect(st.adminFactory).not.toHaveBeenCalled();
    expect(st.billing).not.toHaveBeenCalled();
    expect(st.agent).not.toHaveBeenCalled();
    expect(st.agentJson).not.toHaveBeenCalled();
  });

  it("still refuses on refresh, so bypassing cache cannot generate fake lessons", async () => {
    expect((await POST(request("custom_slides", true))).status).toBe(409);
    expect(st.billing).not.toHaveBeenCalled();
  });

  it("keeps a real published teaching summary available without AI charges", async () => {
    st.lesson = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "الفاعل",
      summary: "الفاعل اسم مرفوع يدل على من قام بالفعل.",
      content: "في جملة قرأَ الطفلُ القصةَ، الفاعل هو الطفلُ، وعلامة رفعه الضمة.",
    };
    const response = await POST(request("summary"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.shortSummary).toBe(st.lesson.summary);
    expect(st.billing).not.toHaveBeenCalled();
  });

  it("does not load lesson or spend a token for unauthenticated clients", async () => {
    st.user = null;
    const response = await POST(request("flashcards"));
    expect(response.status).toBe(401);
    expect(st.dbReads).not.toHaveBeenCalled();
  });

  it("the separate study UI blocks generation and explains source review", () => {
    const page = readFileSync("app/lessons/[id]/study/page.tsx", "utf8");
    expect(page).toContain("isKnownNonTeachingLessonPlaceholder(lesson.content)");
    expect(page).toContain("أدوات المذاكرة قيد المراجعة لهذا الدرس");
    expect(page).toContain("العودة إلى صفحة الدرس");
    expect(page).toContain("<LessonStudyStudio");
  });
});
