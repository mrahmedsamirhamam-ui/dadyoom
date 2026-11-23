import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AnswerPayload = {
  attemptId?: unknown;
  questionId?: unknown;
  selectedOption?: unknown;
};

/**
 * DRAFT / NO-GO: requires review-only SQL migration and isolated integration tests.
 * No browser-provided correctness or score is accepted.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  let body: AnswerPayload;
  try {
    body = (await request.json()) as AnswerPayload;
  } catch {
    return NextResponse.json({ success: false, error: "بيانات غير صالحة." }, { status: 400 });
  }
  if (!body || typeof body.attemptId !== "string" ||
      typeof body.questionId !== "string" ||
      typeof body.selectedOption !== "number" ||
      !Number.isInteger(body.selectedOption) || body.selectedOption < 0 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.attemptId) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.questionId)) {
    return NextResponse.json({ success: false, error: "بيانات الإجابة غير صالحة." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("submit_atomic_assessment_answer", {
    p_attempt_id: body.attemptId,
    p_question_id: body.questionId,
    p_selected_option: body.selectedOption,
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ success: false, error: "تم تسجيل هذه الإجابة سابقًا." }, { status: 409 });
    }
    if (error.code === "42501" || error.code === "28000") {
      return NextResponse.json({ success: false, error: "غير مصرح." }, { status: 403 });
    }
    if (error.code === "22023") {
      return NextResponse.json({ success: false, error: "المحاولة أو الإجابة غير صالحة." }, { status: 400 });
    }
    console.error("ATOMIC_ASSESSMENT_RPC_FAILED", { code: error.code });
    return NextResponse.json({ success: false, error: "تعذر تصحيح الإجابة." }, { status: 500 });
  }
  return NextResponse.json({ success: true, result: data }, { headers: { "Cache-Control": "no-store" } });
}
