"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { finalizePaymentOrder } from "@/lib/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";
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

function normalizeBpayMobile(value: string) {
  const digits = value.replace(/\D/gu, "");
  const local = digits.startsWith("973") ? digits.slice(3) : digits;

  if (!/^\d{8}$/u.test(local)) {
    return null;
  }

  return `+973${local}`;
}

export async function createMarketplaceCourse(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await teacherSession();
    const title = text(formData, "title");
    const description = text(formData, "description");
    const deliveryMode = text(formData, "deliveryMode");
    const startsAtRaw = text(formData, "startsAt");
    const endsAtRaw = text(formData, "endsAt");
    const scheduleNote = text(formData, "scheduleNote");
    const maxStudentsRaw = text(formData, "maxStudents");
    const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
    const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
    const maxStudents = maxStudentsRaw
      ? Math.max(1, Math.min(10000, Number(maxStudentsRaw)))
      : null;
    const price = Math.max(
      0.5,
      Number(text(formData, "price") || 0.5),
    );

    if (
      (startsAt && Number.isNaN(startsAt.getTime())) ||
      (endsAt && Number.isNaN(endsAt.getTime())) ||
      (startsAt && endsAt && endsAt <= startsAt) ||
      (maxStudents !== null && !Number.isFinite(maxStudents))
    ) {
      return {
        ok: false,
        message: "راجع موعد الدورة وعدد المقاعد.",
      };
    }

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
        starts_at: startsAt?.toISOString() ?? null,
        ends_at: endsAt?.toISOString() ?? null,
        schedule_note: scheduleNote || null,
        max_students: maxStudents,
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

    if (!courseId) {
      return {
        ok: false,
        message: "الدورة غير محددة.",
      };
    }

    const { data: payout, error: payoutError } = await db
      .from("edu_teacher_payout_profiles")
      .select("bpay_mobile")
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (payoutError) throw payoutError;

    if (!payout?.bpay_mobile) {
      return {
        ok: false,
        message:
          "أضف رقم BPay البحريني في بيانات استلام الأرباح قبل نشر الدورة.",
      };
    }

    const { data: publishedCourse, error } = await db
      .from("edu_marketplace_courses")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!publishedCourse) {
      return {
        ok: false,
        message: "الدورة غير موجودة أو لا تملك صلاحية نشرها.",
      };
    }

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

    const bpayRaw = text(formData, "bpayMobile");
    const bpayMobile = bpayRaw ? normalizeBpayMobile(bpayRaw) : null;

    if (bpayRaw && !bpayMobile) {
      return {
        ok: false,
        message: "اكتب رقم BPay البحريني المكوّن من 8 أرقام.",
      };
    }

    const { error } = await db
      .from("edu_teacher_payout_profiles")
      .upsert(
        {
          teacher_id: user.id,
          bpay_mobile: bpayMobile,
          bpay_name: text(formData, "bpayName") || null,
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
      message: "تم حفظ بيانات BPay وطريقة استلام أرباحك.",
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


export async function confirmBpayCoursePayment(
  formData: FormData,
): Promise<Result> {
  try {
    const { db, user } = await teacherSession();
    const paymentOrderId = text(formData, "paymentOrderId");

    if (!paymentOrderId) {
      return {
        ok: false,
        message: "طلب الدفع غير محدد.",
      };
    }

    const admin = createAdminClient();

    const { data: payment, error: paymentError } = await admin
      .from("edu_payment_orders")
      .select("id,course_id,status,provider,bank_reference")
      .eq("id", paymentOrderId)
      .eq("kind", "course")
      .eq("provider", "bpay")
      .maybeSingle();

    if (paymentError || !payment?.course_id) {
      return {
        ok: false,
        message: "طلب BPay غير موجود.",
      };
    }

    if (payment.status === "completed") {
      return {
        ok: true,
        message: "تم تأكيد هذه الدفعة سابقًا.",
      };
    }

    if (payment.status !== "approved" || !payment.bank_reference) {
      return {
        ok: false,
        message: "الطالب لم يرسل مرجع BPay بعد.",
      };
    }

    const { data: ownedCourse } = await db
      .from("edu_marketplace_courses")
      .select("id")
      .eq("id", payment.course_id)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!ownedCourse) {
      return {
        ok: false,
        message: "لا تملك صلاحية تأكيد هذه الدفعة.",
      };
    }

    // Payment recording and entitlement provisioning must finish first.
    // The client refreshes the current page *after* receiving this result.
    // Revalidating three routes within this Server Action also returns an
    // expensive refreshed RSC tree and can withhold the confirmation message.
    // Existing auth, course ownership, BPay-reference and completion guards remain.
    await finalizePaymentOrder(paymentOrderId);

    return {
      ok: true,
      message: "تم تأكيد استلام BPay وفتح الدورة للطالب.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تأكيد دفعة BPay.",
    };
  }
}
