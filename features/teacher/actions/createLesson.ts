
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^\u0600-\u06ffa-z0-9\s-]/giu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "lesson";

  return `${base}-${Date.now()}`;
}

export async function createTeacherLesson(formData: FormData) {
  const title = clean(formData.get("title"), 200);
  const unitId = clean(formData.get("unit_id"), 100);
  const summary = clean(formData.get("summary"), 1200);
  const content = clean(formData.get("content"), 30000);
  const lessonType = clean(formData.get("lesson_type"), 50) || "reading";
  const estimatedMinutesRaw = Number(clean(formData.get("estimated_minutes"), 10));
  const estimatedMinutes = Number.isFinite(estimatedMinutesRaw)
    ? Math.min(180, Math.max(5, Math.round(estimatedMinutesRaw)))
    : 20;

  if (!title) throw new Error("عنوان الدرس مطلوب.");
  if (!unitId) throw new Error("اختر الوحدة التي ينتمي إليها الدرس.");
  if (!content) throw new Error("اكتب محتوى الدرس الأساسي قبل إنشائه.");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role?.trim().toLowerCase() ?? "";
  if (profileError || (role !== "teacher" && role !== "admin")) {
    throw new Error("غير مصرح لهذا الحساب بإنشاء الدروس.");
  }

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id")
    .eq("id", unitId)
    .maybeSingle();

  if (unitError || !unit) throw new Error("الوحدة المختارة غير موجودة أو غير متاحة.");

  const { data: lastLesson, error: orderError } = await supabase
    .from("lessons")
    .select("lesson_number,sort_order")
    .eq("unit_id", unitId)
    .order("lesson_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) throw orderError;

  const nextOrder = Math.max(
    Number(lastLesson?.lesson_number ?? 0),
    Number(lastLesson?.sort_order ?? 0)
  ) + 1;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({
      created_by: user.id,
      title,
      slug: slugify(title),
      unit_id: unitId,
      lesson_number: nextOrder,
      sort_order: nextOrder,
      lesson_type: lessonType,
      estimated_minutes: estimatedMinutes,
      summary: summary || null,
      content,
      status: "draft",
      learning_objectives: [],
      instructions: [],
      vocabulary: [],
    })
    .select("id")
    .single();

  if (error || !lesson) {
    console.error("TEACHER_CREATE_LESSON_ERROR:", error);
    throw new Error("تعذر إنشاء الدرس. راجع الوحدة والصلاحيات ثم حاول مرة أخرى.");
  }

  revalidatePath("/teacher");
  revalidatePath("/courses");
  redirect(`/teacher/${lesson.id}`);
}
