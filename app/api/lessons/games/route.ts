import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { sourceForAutomaticGameQuestions } from "@/lib/games/lesson-question-source";
import {
  approvedPack, buildLessonGamePack, distributeGameAnswerPositions, GAME_MODES,
  type QuestionRow, type VocabularyRow,
} from "@/lib/games/lesson-game-pack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && secret ? createSupabaseAdmin(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) : null;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("lessonId")?.trim();
  if (!id || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "معرّف الدرس غير صالح." }, { status: 400, headers });
  }
  const db = await createClient();
  // Always verify a published lesson before accessing any cached game pack.
  const lessonResult = await db.from("lessons")
    .select("id,title,content,summary").eq("id", id).eq("status", "published").maybeSingle();
  if (lessonResult.error) {
    console.error("LESSON_GAME_LESSON_LOOKUP_FAILED", { code: lessonResult.error.code });
    return NextResponse.json({ error: "تعذر تحميل الدرس مؤقتًا." }, { status: 503, headers });
  }
  if (!lessonResult.data) {
    return NextResponse.json({ error: "الدرس غير متاح." }, { status: 404, headers });
  }

  // An approved AI proposal can be published here by an authenticated admin.
  // It has no scripting/HTML; the browser renders only text in fixed UI.
  const { data: { user } } = await db.auth.getUser();
  if (user) {
    const cached = await db.from("edu_lesson_game_packs")
      .select("content,prompt_version").eq("lesson_id", id).maybeSingle();
    if (cached.data &&
      ["human-approved-html-v2", "ai-reviewed-html-v2"].includes(cached.data.prompt_version)) {
      const pack = approvedPack(cached.data.content);
      if (pack) return NextResponse.json({
        ok: true, pack: distributeGameAnswerPositions(pack), modes: GAME_MODES, source: "reviewed-question-bank",
        questionsPerGame: 5, cached: true, progressSaved: true,
      }, { headers });
    }
  }

  const [q, v] = await Promise.all([
    db.from("questions")
      .select("question,options,correct_answer")
      .eq("lesson_id", id).order("question_order", { ascending: true }).limit(35),
    db.from("lesson_vocabulary")
      .select("word,meaning")
      .eq("lesson_id", id).order("display_order", { ascending: true }).limit(35),
  ]);
  if (q.error || v.error) {
    console.error("LESSON_GAME_BANK_LOOKUP_FAILED", {
      questionsCode: q.error?.code ?? null,
      vocabularyCode: v.error?.code ?? null,
    });
    return NextResponse.json(
      { error: "تعذر تحميل بنك الألعاب الآن. حاول مرة أخرى." },
      { status: 503, headers },
    );
  }
  // Reject unreviewed OCR and curriculum-scope text for auto-generated
  // prompts, while preserving human-authored questions and vocabulary.
  const contentForExercises = sourceForAutomaticGameQuestions({
    content: lessonResult.data.content,
    summary: lessonResult.data.summary,
  });
  const result = buildLessonGamePack(
    String(lessonResult.data.title ?? ""),
    contentForExercises,
    (q.data ?? []) as QuestionRow[],
    (v.data ?? []) as VocabularyRow[],
  );
  if (!result.pack) {
    return NextResponse.json({
      ok: false, error: "محتوى هذا الدرس لا يكفي لتقديم خمسة أسئلة مختلفة في كل لعبة بأمان.",
      code: "LESSON_GAME_BANK_NEEDS_CONTENT",
      bankSize: result.bankSize,
      needsReview: true,
    }, { status: 422, headers });
  }
  return NextResponse.json({
    ok: true, pack: distributeGameAnswerPositions(result.pack), modes: GAME_MODES, source: "lesson-questions-and-excerpts",
    questionsPerGame: 5, bankSize: result.bankSize,
    progressSaved: Boolean(user),
    warning: result.generated > 0
      ? "بعض تدريبات إكمال النص مأخوذة من مادة ضاديوم المنشورة وليست أسئلة معتمدة من الكتاب الوزاري."
      : undefined,
  }, { headers });
}

// AI Studio may produce a JSON proposal, but a privileged *human* must review
// all 25 prompts and confirm each answer before it becomes visible to pupils.
export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "مصدر الطلب غير مقبول." }, { status: 403, headers });
  }
  if (request.headers.get("x-dadyoom-approved-game-pack") !== "1") {
    return NextResponse.json({ error: "طلب نشر غير مصرح به." }, { status: 403, headers });
  }
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "سجل الدخول أولًا." }, { status: 401, headers });
  const profile = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile.error || profile.data?.role !== "admin") {
    return NextResponse.json({ error: "صلاحية اعتماد الألعاب للإدارة فقط." }, { status: 403, headers });
  }
  let body: { lessonId?: unknown; approved?: unknown; pack?: unknown; aiAssisted?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات JSON غير صحيحة." }, { status: 400, headers });
  }
  const id = typeof body.lessonId === "string" ? body.lessonId : "";
  const pack = approvedPack(body.pack);
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id) ||
    body.approved !== true || !pack) {
    return NextResponse.json({
      error: "يجب اعتماد خمس ألعاب، بخمسة أسئلة صحيحة ومختلفة لكل لعبة.",
    }, { status: 400, headers });
  }
  const exists = await db.from("lessons").select("id").eq("id", id)
    .eq("status", "published").maybeSingle();
  if (!exists.data || exists.error) return NextResponse.json({ error: "الدرس غير متاح." }, { status: 404, headers });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "تخزين الألعاب المعتمدة غير مهيأ." }, { status: 503, headers });

  const save = await admin.from("edu_lesson_game_packs").upsert({
    lesson_id: id,
    content: pack,
    provider: "dadyoom-reviewed",
    model: null,
    prompt_version: body.aiAssisted === true ? "ai-reviewed-html-v2" : "human-approved-html-v2",
    updated_at: new Date().toISOString(),
  }, { onConflict: "lesson_id" });
  if (save.error) {
    console.error("GAME_PACK_APPROVAL_SAVE_FAILED", save.error.code);
    return NextResponse.json({ error: "تعذر نشر الحزمة بعد المراجعة." }, { status: 503, headers });
  }
  return NextResponse.json({ ok: true, lessonId: id, modes: 5,
    questionsPerMode: 5, reviewedBy: user.id }, { headers });
}
