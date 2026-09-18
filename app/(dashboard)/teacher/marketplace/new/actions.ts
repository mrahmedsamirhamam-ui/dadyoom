"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type PaidProductResult = {
  ok: boolean;
  message: string;
  courseId?: string;
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function teacherSession() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("سجل الدخول أولًا.");
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.role !== "teacher" &&
    profile?.role !== "admin"
  ) {
    throw new Error("هذه المساحة للمعلمين.");
  }

  return { db, user };
}

function safeHttpsUrl(raw: string) {
  if (!raw) return "";

  const url = new URL(raw);

  if (url.protocol !== "https:") {
    throw new Error(
      "روابط الفيديو يجب أن تكون HTTPS.",
    );
  }

  return url.toString();
}

export async function createPaidProduct(
  formData: FormData,
): Promise<PaidProductResult> {
  try {
    const { db, user } = await teacherSession();

    const productType =
      text(formData, "productType") === "single"
        ? "single"
        : "course";

    const title = text(formData, "title");
    const description = text(formData, "description");
    const lessonTitle =
      text(formData, "lessonTitle") || title;
    const lessonContent =
      text(formData, "lessonContent");
    const deliveryMode = text(formData, "deliveryMode");
    const publishNow =
      text(formData, "publishNow") === "on";
    const rightsConfirmed =
      text(formData, "rightsConfirmed") === "on";

    const price = Number(
      text(formData, "price"),
    );

    if (title.length < 3 || title.length > 160) {
      return {
        ok: false,
        message:
          "اسم المنتج يجب أن يكون بين 3 و160 حرفًا.",
      };
    }

    if (
      !Number.isFinite(price) ||
      price < 1 ||
      price > 100
    ) {
      return {
        ok: false,
        message:
          "السعر المسموح حاليًا من 1 إلى 100 دينار بحريني.",
      };
    }

    const videoUrl = safeHttpsUrl(
      text(formData, "videoUrl"),
    );

    if (videoUrl && !rightsConfirmed) {
      return {
        ok: false,
        message:
          "لا يمكن إضافة فيديو قبل تأكيد ملكيتك أو ترخيصك التجاري له.",
      };
    }

    if (
      publishNow &&
      !lessonContent &&
      !videoUrl
    ) {
      return {
        ok: false,
        message:
          "أضف محتوى الدرس أو فيديو مرخصًا قبل النشر.",
      };
    }

    const slug =
      `${
        productType === "single"
          ? "lesson"
          : "course"
      }-${crypto.randomUUID().slice(0, 10)}`;

    const { data: course, error: courseError } =
      await db
        .from("edu_marketplace_courses")
        .insert({
          teacher_id: user.id,
          slug,
          title,
          description,
          price: Number(price.toFixed(3)),
          currency: "BHD",
          delivery_mode:
            deliveryMode === "live" ||
            deliveryMode === "mixed"
              ? deliveryMode
              : "recorded",
          status: "draft",
          // Fixed server-side: teacher cannot lower platform share.
          commission_bps: 1500,
        })
        .select("id")
        .single();

    if (courseError || !course) {
      throw courseError ??
        new Error("تعذر إنشاء المنتج.");
    }

    const { error: lessonError } =
      await db
        .from("edu_marketplace_course_lessons")
        .insert({
          course_id: course.id,
          title: lessonTitle,
          description:
            productType === "single"
              ? "درس مدفوع مستقل"
              : "الدرس الأول في الدورة",
          content: lessonContent,
          video_url: videoUrl || null,
          sort_order: 1,
          is_preview: false,
        });

    if (lessonError) {
      await db
        .from("edu_marketplace_courses")
        .delete()
        .eq("id", course.id)
        .eq("teacher_id", user.id);

      throw lessonError;
    }

    if (publishNow) {
      const { error: publishError } =
        await db
          .from("edu_marketplace_courses")
          .update({
            status: "published",
            updated_at: new Date().toISOString(),
          })
          .eq("id", course.id)
          .eq("teacher_id", user.id);

      if (publishError) {
        throw publishError;
      }
    }

    revalidatePath("/teacher/marketplace");
    revalidatePath("/teacher/marketplace/new");
    revalidatePath("/marketplace");

    return {
      ok: true,
      courseId: String(course.id),
      message: publishNow
        ? "تم نشر المنتج في سوق ضاديوم. 85% للمعلم و15% لضاديوم تلقائيًا."
        : "تم حفظ المنتج كمسودة. 85% للمعلم و15% لضاديوم عند البيع.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر إنشاء المنتج.",
    };
  }
}
