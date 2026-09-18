"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function text(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

async function adminSession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.role
      ?.trim()
      .toLowerCase() !== "admin"
  ) {
    throw new Error("غير مصرح.");
  }

  return {
    user,
    db:
      supabase as unknown as SupabaseClient,
  };
}

export async function savePlatformPayoutProfile(
  formData: FormData,
) {
  const { db, user } =
    await adminSession();

  const paypalEmail =
    text(formData, "paypalEmail");
  const iban =
    text(formData, "iban");
  const accountHolder =
    text(formData, "accountHolder");
  const bankName =
    text(formData, "bankName");
  const swift =
    text(formData, "swift");
  const country =
    text(formData, "country");

  const { error } = await db
    .from(
      "edu_platform_payout_profile",
    )
    .upsert(
      {
        id: "default",
        paypal_email:
          paypalEmail || null,
        iban:
          iban || null,
        account_holder_name:
          accountHolder || null,
        bank_name:
          bankName || null,
        swift_bic:
          swift || null,
        country:
          country || null,
        updated_by:
          user.id,
        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

  if (error) {
    throw new Error(
      "تعذر حفظ بيانات استلام أرباح ضاديوم.",
    );
  }

  revalidatePath(
    "/admin/payments",
  );
}
