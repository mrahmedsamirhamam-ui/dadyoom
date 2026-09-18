import Link from "next/link";
import { redirect } from "next/navigation";

import { finalizePaymentOrder } from "@/lib/payments/orders";
import {
  normalizeTapPaymentMethod,
  retrieveTapCharge,
} from "@/lib/payments/tap";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TapReturnPage({
  searchParams,
}: {
  searchParams: Promise<{
    tap_id?: string;
  }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const chargeId = String(
    params.tap_id ?? "",
  ).trim();

  if (!chargeId) {
    return (
      <Result
        ok={false}
        message="معرّف عملية الدفع غير موجود."
      />
    );
  }

  const charge = await retrieveTapCharge(
    chargeId,
  );

  const db = createAdminClient();

  const { data: payment } = await db
    .from("edu_payment_orders")
    .select(
      "id,buyer_id,amount,currency,status,kind,payment_method",
    )
    .eq("provider", "tap")
    .eq("provider_order_id", charge.id)
    .maybeSingle();

  if (
    !payment ||
    payment.buyer_id !== user.id
  ) {
    return (
      <Result
        ok={false}
        message="لم نعثر على عملية الدفع الخاصة بهذا الحساب."
      />
    );
  }

  const amountOk =
    Math.abs(
      Number(payment.amount) -
        Number(charge.amount),
    ) < 0.0005;

  const currencyOk =
    String(payment.currency).toUpperCase() ===
    String(charge.currency).toUpperCase();

  if (!amountOk || !currencyOk) {
    return (
      <Result
        ok={false}
        message="بيانات المبلغ لا تطابق الطلب."
      />
    );
  }

  const method =
    normalizeTapPaymentMethod(
      charge.source?.payment_method,
    ) ??
    normalizeTapPaymentMethod(
      payment.payment_method,
    );

  if (!method) {
    return (
      <Result
        ok={false}
        message="ضاديوم يقبل Visa وMastercard فقط."
      />
    );
  }

  if (
    charge.status === "CAPTURED" &&
    payment.status !== "completed"
  ) {
    await db
      .from("edu_payment_orders")
      .update({
        payment_method: method,
      })
      .eq("id", payment.id);

    await finalizePaymentOrder(
      String(payment.id),
    );
  }

  if (charge.status === "CAPTURED") {
    return (
      <Result
        ok
        message={
          payment.kind === "course"
            ? "تم الدفع وفتح الدورة بنجاح."
            : "تم الدفع وتفعيل اشتراك Plus بنجاح."
        }
      />
    );
  }

  return (
    <Result
      ok={false}
      message={`حالة العملية: ${charge.status}`}
    />
  );
}

function Result({
  ok,
  message,
}: {
  ok: boolean;
  message: string;
}) {
  return (
    <main
      dir="rtl"
      className="mx-auto max-w-xl px-4 py-16"
    >
      <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">
          {ok ? "✅" : "⚠️"}
        </div>

        <h1 className="mt-4 text-2xl font-black text-[#123f39]">
          {ok
            ? "تمت العملية"
            : "لم تكتمل العملية"}
        </h1>

        <p className="mt-3 leading-8 text-slate-700">
          {message}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/pricing"
            className="rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white"
          >
            الاشتراكات
          </Link>

          <Link
            href="/marketplace"
            className="rounded-2xl border px-5 py-3 font-black"
          >
            الدورات
          </Link>
        </div>
      </div>
    </main>
  );
}
