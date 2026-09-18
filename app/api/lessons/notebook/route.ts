import {
  type SupabaseClient,
} from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول." },
      { status: 401 },
    );
  }

  const lessonId =
    new URL(request.url).searchParams.get("lessonId")?.trim();

  if (!lessonId) {
    return NextResponse.json(
      { error: "الدرس غير محدد." },
      { status: 400 },
    );
  }

  const { data, error } = await db
    .from("edu_lesson_notebooks")
    .select("notes,pinned_items,updated_at")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    notes: data?.notes ?? "",
    pinnedItems: data?.pinned_items ?? [],
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as {
    lessonId?: string;
    notes?: string;
  };

  const lessonId = String(body.lessonId ?? "").trim();

  if (!lessonId) {
    return NextResponse.json(
      { error: "الدرس غير محدد." },
      { status: 400 },
    );
  }

  const { error } = await db
    .from("edu_lesson_notebooks")
    .upsert(
      {
        student_id: user.id,
        lesson_id: lessonId,
        notes: String(body.notes ?? "").slice(0, 40000),
        pinned_items: [],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,lesson_id",
      },
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
