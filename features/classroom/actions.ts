"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { invalidateStudentCaches } from "@/features/student-progress/services/invalidate-student-caches";

type Result = { ok: boolean; message: string };

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

async function session() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: profile, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("تعذر قراءة صلاحيات المستخدم.");
  }

  return {
    supabase,
    db,
    user,
    role: String(profile.role),
  };
}

export async function sendMessageAction(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await session();

    const classId = value(formData, "classId");
    const teacherId = value(formData, "teacherId");
    const studentId = value(formData, "studentId");
    const body = value(formData, "body");

    if (!classId || !teacherId || !studentId || !body) {
      return { ok: false, message: "بيانات الرسالة غير مكتملة." };
    }

    let conversationId = "";

    const { data: existing, error: findError } = await db
      .from("edu_conversations")
      .select("id")
      .eq("class_id", classId)
      .eq("teacher_id", teacherId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing?.id) {
      conversationId = String(existing.id);
    } else {
      const { data: created, error: createError } = await db
        .from("edu_conversations")
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          student_id: studentId,
        })
        .select("id")
        .single();

      if (createError || !created) {
        throw createError ?? new Error("تعذر إنشاء المحادثة.");
      }

      conversationId = String(created.id);
    }

    const { error } = await db.from("edu_messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body,
    });

    if (error) throw error;

    revalidatePath("/teacher/classroom");
    revalidatePath("/student/classroom");

    return { ok: true, message: "تم إرسال الرسالة." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر إرسال الرسالة.",
    };
  }
}

export async function awardStudentAction(
  formData: FormData,
): Promise<Result> {
  try {
    const { supabase, db, user, role } = await session();
    const cleanRole = role.trim().toLowerCase();

    if (!["teacher", "school", "admin"].includes(cleanRole)) {
      return {
        ok: false,
        message: "منح الجوائز متاح للمعلم أو المدرسة فقط.",
      };
    }

    const studentId = value(formData, "studentId");
    const classId = value(formData, "classId");
    const schoolId = value(formData, "schoolId");
    const title = value(formData, "title");
    const description = value(formData, "description");
    const icon = value(formData, "icon") || "🏆";
    const points = Math.max(
      1,
      Math.min(10000, Math.round(Number(value(formData, "points") || 0))),
    );

    if (!studentId || !title) {
      return { ok: false, message: "اختر الطالب واكتب اسم الجائزة." };
    }

    let safeClassId: string | null = null;
    let safeSchoolId: string | null = null;

    if (cleanRole === "teacher") {
      if (!classId) {
        return { ok: false, message: "اختر فصلًا تابعًا للمعلم." };
      }

      const ownedClass = await db
        .from("teacher_classes")
        .select("id")
        .eq("id", classId)
        .eq("teacher_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const member = await db
        .from("teacher_class_students")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentId)
        .eq("is_active", true)
        .maybeSingle();

      if (ownedClass.error || !ownedClass.data || member.error || !member.data) {
        return { ok: false, message: "الطالب أو الفصل غير تابع لهذا المعلم." };
      }

      safeClassId = classId;
    }

    if (cleanRole === "school") {
      if (!schoolId || !classId) {
        return { ok: false, message: "بيانات المدرسة أو الفصل غير مكتملة." };
      }

      const school = await db
        .from("schools")
        .select("id")
        .eq("id", schoolId)
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      const classRow = await db
        .from("teacher_classes")
        .select("id,teacher_id")
        .eq("id", classId)
        .eq("is_active", true)
        .maybeSingle();

      if (school.error || !school.data || classRow.error || !classRow.data) {
        return { ok: false, message: "المدرسة أو الفصل غير صالح." };
      }

      const teacherLink = await db
        .from("school_teachers")
        .select("id")
        .eq("school_id", schoolId)
        .eq("teacher_id", classRow.data.teacher_id)
        .eq("is_active", true)
        .maybeSingle();

      const member = await db
        .from("teacher_class_students")
        .select("id")
        .eq("class_id", classId)
        .eq("student_id", studentId)
        .eq("is_active", true)
        .maybeSingle();

      if (teacherLink.error || !teacherLink.data || member.error || !member.data) {
        return { ok: false, message: "الطالب أو الفصل غير تابع لهذه المدرسة." };
      }

      safeClassId = classId;
      safeSchoolId = schoolId;
    }

    if (cleanRole === "admin") {
      const target = await db
        .from("profiles")
        .select("role")
        .eq("id", studentId)
        .maybeSingle();

      const targetRole = target.data?.role?.trim().toLowerCase();
      if (target.error || !["student", "child"].includes(targetRole ?? "")) {
        return { ok: false, message: "الحساب المحدد ليس طالبًا أو طفلًا." };
      }

      safeClassId = classId || null;
      safeSchoolId = schoolId || null;
    }

    const issuerRole =
      cleanRole === "school"
        ? "school"
        : cleanRole === "admin"
          ? "admin"
          : "teacher";

    const { error } = await db.from("edu_rewards").insert({
      student_id: studentId,
      issuer_id: user.id,
      issuer_role: issuerRole,
      class_id: safeClassId,
      school_id: safeSchoolId,
      points,
      title,
      description: description || null,
      icon,
    });

    if (error) throw error;

    const target = await db
      .from("profiles")
      .select("email")
      .eq("id", studentId)
      .maybeSingle();

    await invalidateStudentCaches({
      studentId,
      studentEmail: target.data?.email ?? null,
      supabase,
    });

    revalidatePath("/teacher/classroom");
    revalidatePath("/student");
    revalidatePath("/student/classroom");
    revalidatePath("/school/rewards");
    revalidatePath("/rewards");

    return {
      ok: true,
      message: `تم منح ${points} نقطة وجائزة ${title}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر منح الجائزة.",
    };
  }
}

type DraftQuestion = {
  type?: "multiple_choice" | "true_false" | "short_answer" | "essay";
  prompt?: string;
  options?: string[];
  correctAnswer?: string | boolean | number | null;
  explanation?: string;
  points?: number;
};

export async function createAssignmentAction(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user, role } = await session();

    if (role !== "teacher" && role !== "admin") {
      return { ok: false, message: "إنشاء المهام متاح للمعلم." };
    }

    const classId = value(formData, "classId");
    const studentId = value(formData, "studentId");
    const lessonId = value(formData, "lessonId");
    const title = value(formData, "title");
    const instructions = value(formData, "instructions");
    const dueAt = value(formData, "dueAt");
    const kindRaw = value(formData, "kind");
    const kind =
      kindRaw === "quiz" || kindRaw === "practice" ? kindRaw : "homework";

    if (!classId || !title) {
      return { ok: false, message: "اختر الفصل واكتب عنوان المهمة." };
    }

    let questions: DraftQuestion[] = [];
    const raw = value(formData, "questionsJson");

    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) questions = parsed as DraftQuestion[];
    }

    const maxPoints = Math.max(
      1,
      questions.reduce(
        (sum, question) => sum + Math.max(0, Number(question.points ?? 1)),
        0,
      ) || 10,
    );

    const { data: assignment, error } = await db
      .from("edu_assignments")
      .insert({
        teacher_id: user.id,
        class_id: classId,
        lesson_id: lessonId || null,
        kind,
        target_mode: studentId ? "students" : "class",
        title,
        instructions,
        due_at: dueAt || null,
        max_points: maxPoints,
        ai_generated: value(formData, "aiGenerated") === "true",
        status: "published",
      })
      .select("id")
      .single();

    if (error || !assignment) {
      throw error ?? new Error("تعذر إنشاء المهمة.");
    }

    if (studentId) {
      const { error: targetError } = await db
        .from("edu_assignment_targets")
        .insert({
          assignment_id: assignment.id,
          student_id: studentId,
        });

      if (targetError) throw targetError;
    }

    const rows = questions
      .filter((question) => String(question.prompt ?? "").trim())
      .map((question, index) => ({
        assignment_id: assignment.id,
        question_order: index + 1,
        question_type: question.type ?? "short_answer",
        prompt: String(question.prompt ?? "").trim(),
        options: Array.isArray(question.options) ? question.options : [],
        correct_answer:
          question.correctAnswer === undefined ? null : question.correctAnswer,
        explanation: question.explanation ?? null,
        points: Math.max(0, Number(question.points ?? 1)),
      }));

    if (rows.length) {
      const { error: questionError } = await db
        .from("edu_assignment_questions")
        .insert(rows);

      if (questionError) throw questionError;
    }

    revalidatePath("/teacher/classroom");
    revalidatePath("/student/classroom");

    return {
      ok: true,
      message: studentId
        ? "تم نشر المهمة للطالب المحدد."
        : "تم نشر المهمة للفصل.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر إنشاء المهمة.",
    };
  }
}

export async function submitAssignmentAction(
  formData: FormData,
): Promise<Result> {
  try {
    const { db } = await session();
    const assignmentId = value(formData, "assignmentId");

    if (!assignmentId) {
      return { ok: false, message: "المهمة غير محددة." };
    }

    const answers: Record<string, string> = {};

    for (const [key, answer] of formData.entries()) {
      if (key.startsWith("answer:")) {
        answers[key.slice("answer:".length)] = String(answer).trim();
      }
    }

    const { data, error } = await db.rpc("edu_submit_assignment", {
      p_assignment_id: assignmentId,
      p_answers: answers,
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    const score = Number(row?.score ?? 0);
    const maxScore = Number(row?.max_score ?? 0);

    revalidatePath("/student/classroom");
    revalidatePath("/teacher/classroom");

    return {
      ok: true,
      message: `تم التسليم. النتيجة التلقائية ${score}/${maxScore}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تسليم المهمة.",
    };
  }
}
