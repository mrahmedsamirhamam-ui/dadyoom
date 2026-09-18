"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type Result = {
  ok: boolean;
  message: string;
};

async function teacherSession() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("سجل الدخول أولًا.");
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    throw new Error("هذه المساحة للمعلمين.");
  }

  return { db, user };
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createMarketplaceCourse(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await teacherSession();
    const title = text(formData, "title");
    const description = text(formData, "description");
    const deliveryMode = text(formData, "deliveryMode");
    const price = Math.max(
      0.5,
      Number(text(formData, "price") || 0.5),
    );

    if (!title) {
      return {
        ok: false,
        message: "اكتب اسم الدورة.",
      };
    }

    const slug = `course-${crypto.randomUUID().slice(0, 10)}`;

    const { error } = await db
      .from("edu_marketplace_courses")
      .insert({
        teacher_id: user.id,
        slug,
        title,
        description,
        price,
        currency: "BHD",
        delivery_mode:
          deliveryMode === "live" || deliveryMode === "mixed"
            ? deliveryMode
            : "recorded",
        status: "draft",
        commission_bps: 1500,
      });

    if (error) throw error;

    revalidatePath("/teacher/marketplace");
    revalidatePath("/marketplace");

    return {
      ok: true,
      message: "تم إنشاء الدورة بنسبة 85% للمعلم و15% لضاديوم.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر إنشاء الدورة.",
    };
  }
}

export async function addMarketplaceLesson(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await teacherSession();
    const courseId = text(formData, "courseId");
    const title = text(formData, "title");
    const description = text(formData, "description");
    const content = text(formData, "content");
    const videoUrl = text(formData, "videoUrl");
    const liveUrl = text(formData, "liveUrl");
    const isPreview = text(formData, "isPreview") === "on";

    const { data: course } = await db
      .from("edu_marketplace_courses")
      .select("id")
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!course || !title) {
      return {
        ok: false,
        message: "اختر دورة واكتب عنوان الدرس.",
      };
    }

    const { count } = await db
      .from("edu_marketplace_course_lessons")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("course_id", courseId);

    const { error } = await db
      .from("edu_marketplace_course_lessons")
      .insert({
        course_id: courseId,
        title,
        description,
        content,
        video_url: videoUrl || null,
        live_url: liveUrl || null,
        sort_order: Number(count ?? 0) + 1,
        is_preview: isPreview,
      });

    if (error) throw error;

    revalidatePath("/teacher/marketplace");
    revalidatePath("/marketplace");

    return {
      ok: true,
      message: "تمت إضافة الدرس.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر إضافة الدرس.",
    };
  }
}

export async function publishMarketplaceCourse(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await teacherSession();
    const courseId = text(formData, "courseId");

    const { error } = await db
      .from("edu_marketplace_courses")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .eq("teacher_id", user.id);

    if (error) throw error;

    revalidatePath("/teacher/marketplace");
    revalidatePath("/marketplace");

    return {
      ok: true,
      message: "تم نشر الدورة في سوق ضاديوم.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر النشر.",
    };
  }
}

export async function savePayoutProfile(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await teacherSession();

    const { error } = await db
      .from("edu_teacher_payout_profiles")
      .upsert(
        {
          teacher_id: user.id,
          paypal_email: text(formData, "paypalEmail") || null,
          iban: text(formData, "iban") || null,
          account_holder_name:
            text(formData, "accountHolder") || null,
          bank_name: text(formData, "bankName") || null,
          swift_bic: text(formData, "swift") || null,
          country: text(formData, "country") || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "teacher_id",
        },
      );

    if (error) throw error;

    revalidatePath("/teacher/marketplace");

    return {
      ok: true,
      message: "تم حفظ طريقة استلام أرباحك.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر حفظ بيانات السحب.",
    };
  }
}
