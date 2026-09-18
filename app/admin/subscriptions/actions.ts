"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnerAdmin } from "@/lib/admin/owner-access";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = new Set([
  "student",
  "child",
  "teacher",
  "parent",
  "school",
]);

function value(formData: FormData, key: string, max = 500) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

function months(formData: FormData) {
  const n = Number(value(formData, "months", 4));
  if (!Number.isInteger(n) || n < 1 || n > 24) {
    throw new Error("عدد الشهور يجب أن يكون من 1 إلى 24.");
  }
  return n;
}

function endAfterMonths(base: Date, count: number) {
  const d = new Date(base);
  const originalDay = d.getUTCDate();

  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + count);

  const last = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  d.setUTCDate(
    Math.min(originalDay, last),
  );

  return d;
}

function fail(error: unknown): never {
  const message =
    error instanceof Error
      ? error.message
      : "تعذر تنفيذ العملية.";

  redirect(
    `/admin/subscriptions?error=${encodeURIComponent(
      message.slice(0, 180),
    )}`,
  );
}

function success(message: string): never {
  redirect(
    `/admin/subscriptions?ok=${encodeURIComponent(
      message.slice(0, 180),
    )}`,
  );
}

type AdminDb =
  ReturnType<typeof createAdminClient>;

async function profileByEmail(
  db: AdminDb,
  email: string,
) {
  const { data, error } =
    await db
      .from("profiles")
      .select(
        "id,email,full_name,role,country",
      )
      .ilike("email", email)
      .limit(2);

  if (error) throw error;

  if (!data?.length) {
    return null;
  }

  if (data.length > 1) {
    throw new Error(
      "البريد مكرر في أكثر من حساب.",
    );
  }

  return data[0];
}

async function grantPlus(args: {
  db: AdminDb;
  adminId: string;
  userId: string;
  months: number;
  note: string;
  source:
    | "admin_gift"
    | "admin_manual";
}) {
  const now = new Date();

  const {
    data: existing,
    error: readError,
  } =
    await args.db
      .from("edu_subscriptions")
      .select(
        "id,status,provider,provider_subscription_id,current_period_start,current_period_end",
      )
      .eq("user_id", args.userId)
      .maybeSingle();

  if (readError) {
    throw readError;
  }

  const oldEnd =
    existing?.current_period_end
      ? new Date(
          existing.current_period_end,
        )
      : null;

  const base =
    existing?.status === "active" &&
    oldEnd &&
    oldEnd.getTime() >
      now.getTime()
      ? oldEnd
      : now;

  const newEnd =
    endAfterMonths(
      base,
      args.months,
    );

  const {
    data: saved,
    error: saveError,
  } =
    await args.db
      .from("edu_subscriptions")
      .upsert(
        {
          user_id: args.userId,
          plan_id: "plus",
          status: "active",
          provider:
            existing?.provider ??
            "manual",
          provider_subscription_id:
            existing
              ?.provider_subscription_id ??
            null,
          current_period_start:
            existing
              ?.current_period_start ??
            now.toISOString(),
          current_period_end:
            newEnd.toISOString(),
          cancel_at_period_end: false,
          grant_source:
            args.source,
          admin_note:
            args.note || null,
          granted_by:
            args.adminId,
          updated_at:
            now.toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select("id")
      .single();

  if (saveError) {
    throw saveError;
  }

  const { error: eventError } =
    await args.db
      .from(
        "edu_subscription_events",
      )
      .insert({
        subscription_id:
          saved.id,
        user_id:
          args.userId,
        action:
          existing
            ? "admin_extend"
            : "admin_grant",
        months:
          args.months,
        note:
          args.note || null,
        provider: "manual",
        performed_by:
          args.adminId,
        metadata: {
          source: args.source,
        },
      });

  if (eventError) {
    throw eventError;
  }
}

export async function grantExistingSubscription(
  formData: FormData,
) {
  let message = "";

  try {
    const adminUser =
      await requireOwnerAdmin();

    const db =
      createAdminClient();

    const email =
      value(
        formData,
        "email",
        320,
      ).toLowerCase();

    const count =
      months(formData);

    const note =
      value(
        formData,
        "note",
      );

    if (!email.includes("@")) {
      throw new Error(
        "اكتب بريدًا صحيحًا.",
      );
    }

    const profile =
      await profileByEmail(
        db,
        email,
      );

    if (!profile) {
      throw new Error(
        "الحساب غير موجود. استخدم إنشاء حساب جديد.",
      );
    }

    await grantPlus({
      db,
      adminId:
        adminUser.id,
      userId:
        profile.id,
      months:
        count,
      note,
      source:
        "admin_gift",
    });

    revalidatePath(
      "/admin/subscriptions",
    );

    message =
      `تم منح ${count} شهر Plus للحساب.`;
  }
  catch (error) {
    fail(error);
  }

  success(message);
}

export async function createAccountWithGift(
  formData: FormData,
) {
  let message = "";

  try {
    const adminUser =
      await requireOwnerAdmin();

    const db =
      createAdminClient();

    const fullName =
      value(
        formData,
        "full_name",
        120,
      );

    const email =
      value(
        formData,
        "email",
        320,
      ).toLowerCase();

    const role =
      value(
        formData,
        "role",
        20,
      ).toLowerCase();

    const country =
      value(
        formData,
        "country",
        2,
      ).toUpperCase() ||
      "BH";

    const password =
      value(
        formData,
        "temporary_password",
        128,
      );

    const count =
      months(formData);

    const note =
      value(
        formData,
        "note",
      );

    if (!fullName) {
      throw new Error(
        "اكتب الاسم.",
      );
    }

    if (!email.includes("@")) {
      throw new Error(
        "البريد غير صالح.",
      );
    }

    if (
      !ALLOWED_ROLES.has(
        role,
      )
    ) {
      throw new Error(
        "نوع الحساب غير صالح.",
      );
    }

    if (
      !/^[A-Z]{2}$/u.test(
        country,
      )
    ) {
      throw new Error(
        "رمز الدولة غير صالح.",
      );
    }

    if (
      password.length < 10
    ) {
      throw new Error(
        "كلمة المرور المؤقتة يجب ألا تقل عن 10 أحرف.",
      );
    }

    let profile =
      await profileByEmail(
        db,
        email,
      );

    if (!profile) {
      const {
        data: created,
        error: createError,
      } =
        await db.auth.admin
          .createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name:
                fullName,
              role,
              country,
            },
          });

      if (
        createError ||
        !created.user
      ) {
        throw (
          createError ??
          new Error(
            "تعذر إنشاء الحساب.",
          )
        );
      }

      const {
        error: profileError,
      } =
        await db
          .from("profiles")
          .upsert({
            id:
              created.user.id,
            email,
            full_name:
              fullName,
            role,
            country,
          });

      if (profileError) {
        throw profileError;
      }

      profile = {
        id:
          created.user.id,
        email,
        full_name:
          fullName,
        role,
        country,
      };
    }

    await grantPlus({
      db,
      adminId:
        adminUser.id,
      userId:
        profile.id,
      months:
        count,
      note:
        note ||
        "إضافة يدوية من الإدارة",
      source:
        "admin_manual",
    });

    revalidatePath(
      "/admin/subscriptions",
    );

    message =
      `تم تجهيز الحساب ومنحه Plus لمدة ${count} شهر.`;
  }
  catch (error) {
    fail(error);
  }

  success(message);
}

export async function cancelSubscription(
  formData: FormData,
) {
  let message = "";

  try {
    const adminUser =
      await requireOwnerAdmin();

    const db =
      createAdminClient();

    const subscriptionId =
      value(
        formData,
        "subscription_id",
        80,
      );

    if (!subscriptionId) {
      throw new Error(
        "معرّف الاشتراك غير موجود.",
      );
    }

    const {
      data: current,
      error: readError,
    } =
      await db
        .from("edu_subscriptions")
        .select("id,user_id")
        .eq(
          "id",
          subscriptionId,
        )
        .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (!current) {
      throw new Error(
        "الاشتراك غير موجود.",
      );
    }

    const now =
      new Date()
        .toISOString();

    const {
      error: updateError,
    } =
      await db
        .from("edu_subscriptions")
        .update({
          status:
            "cancelled",
          current_period_end:
            now,
          cancel_at_period_end:
            false,
          admin_note:
            "إلغاء من غرفة المشتركين",
          granted_by:
            adminUser.id,
          updated_at:
            now,
        })
        .eq(
          "id",
          current.id,
        );

    if (updateError) {
      throw updateError;
    }

    const {
      error: eventError,
    } =
      await db
        .from(
          "edu_subscription_events",
        )
        .insert({
          subscription_id:
            current.id,
          user_id:
            current.user_id,
          action:
            "admin_cancel",
          note:
            "إلغاء من غرفة المشتركين",
          provider:
            "manual",
          performed_by:
            adminUser.id,
        });

    if (eventError) {
      throw eventError;
    }

    revalidatePath(
      "/admin/subscriptions",
    );

    message =
      "تم إلغاء الاشتراك.";
  }
  catch (error) {
    fail(error);
  }

  success(message);
}
