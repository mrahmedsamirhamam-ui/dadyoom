import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

import {
  savePlatformPayoutProfile,
} from "./actions";

export default async function AdminPaymentsPage() {
  const supabase =
    await createClient();

  const db =
    supabase as unknown as
      SupabaseClient;

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: payout } =
    await db
      .from(
        "edu_platform_payout_profile",
      )
      .select(
        "paypal_email,iban,account_holder_name,bank_name,swift_bic,country,updated_at",
      )
      .eq(
        "id",
        "default",
      )
      .maybeSingle();

  const paypalConfigured =
    Boolean(
      process.env
        .PAYPAL_CLIENT_ID
        ?.trim(),
    ) &&
    Boolean(
      process.env
        .PAYPAL_CLIENT_SECRET
        ?.trim(),
    );

  const serviceRoleConfigured =
    Boolean(
      process.env
        .SUPABASE_SERVICE_ROLE_KEY
        ?.trim(),
    );

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-4xl space-y-6 px-4 py-8"
    >
      <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
        <p className="text-sm font-black text-[#f3d187]">
          إدارة ضاديوم
        </p>

        <h1 className="mt-2 text-3xl font-black">
          المدفوعات والاستلام
        </h1>

        <p className="mt-3 max-w-2xl leading-8 text-white/85">
          هذه البيانات خاصة بالإدارة ولا تظهر للطلاب أو المعلمين أو الزوار.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-black text-[#123f39]">
            PayPal Checkout
          </div>

          <div className="mt-2 font-bold">
            {paypalConfigured
              ? "مفاتيح الخادم موجودة"
              : "غير مفعّل فعليًا بعد"}
          </div>

          <p className="mt-2 text-sm leading-7 text-slate-600">
            بريد PayPal أدناه ليس بديلًا عن Client ID وClient Secret. مفاتيح PayPal السرية تبقى في بيئة الخادم فقط.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-black text-[#123f39]">
            عمليات الدفع
          </div>

          <div className="mt-2 font-bold">
            {serviceRoleConfigured
              ? "مفتاح خدمة الخادم موجود"
              : "SUPABASE_SERVICE_ROLE_KEY غير مضبوط"}
          </div>

          <p className="mt-2 text-sm leading-7 text-slate-600">
            لا يتم عرض أي مفتاح سري في هذه الصفحة.
          </p>
        </div>
      </section>

      <form
        action={
          savePlatformPayoutProfile
        }
        className="rounded-[2rem] border bg-white p-5 sm:p-6"
      >
        <h2 className="text-xl font-black text-[#123f39]">
          بيانات استلام أرباح ضاديوم
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          يمكنك حفظ PayPal أو الحساب البنكي هنا كمعلومات داخلية خاصة بالإدارة. هذه البيانات محمية بسياسات RLS الخاصة بالمدير.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-black">
              بريد PayPal
            </span>

            <input
              name="paypalEmail"
              type="email"
              autoComplete="off"
              defaultValue={
                payout?.paypal_email ??
                ""
              }
              className="w-full rounded-2xl border p-3"
              placeholder="PayPal email"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-black">
              اسم صاحب الحساب
            </span>

            <input
              name="accountHolder"
              autoComplete="off"
              defaultValue={
                payout
                  ?.account_holder_name ??
                ""
              }
              className="w-full rounded-2xl border p-3"
              placeholder="اسم صاحب الحساب"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-black">
              IBAN
            </span>

            <input
              name="iban"
              autoComplete="off"
              defaultValue={
                payout?.iban ??
                ""
              }
              className="w-full rounded-2xl border p-3 font-mono"
              placeholder="IBAN"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-black">
              اسم البنك
            </span>

            <input
              name="bankName"
              autoComplete="off"
              defaultValue={
                payout?.bank_name ??
                ""
              }
              className="w-full rounded-2xl border p-3"
              placeholder="اسم البنك"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-black">
              SWIFT / BIC
            </span>

            <input
              name="swift"
              autoComplete="off"
              defaultValue={
                payout?.swift_bic ??
                ""
              }
              className="w-full rounded-2xl border p-3 font-mono"
              placeholder="SWIFT / BIC"
            />
          </label>

          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-black">
              الدولة
            </span>

            <input
              name="country"
              autoComplete="off"
              defaultValue={
                payout?.country ??
                ""
              }
              className="w-full rounded-2xl border p-3"
              placeholder="الدولة"
            />
          </label>

          <button
            type="submit"
            className="dadyoom-arabic-button touch-manipulation rounded-2xl p-3 font-black text-white sm:col-span-2"
          >
            حفظ بيانات الاستلام الخاصة
          </button>
        </div>

        {payout?.updated_at ? (
          <p className="mt-3 text-xs text-slate-500">
            توجد بيانات محفوظة بالفعل.
          </p>
        ) : null}
      </form>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
        التحويل البنكي المباشر للمشتري مختلف عن بيانات الاستلام الخاصة بالإدارة: إذا اخترنا أن يدفع المستخدم بتحويل IBAN مباشر، فلا بد أن يعرف حساب التحويل. إذا أردنا إبقاء IBAN مخفيًا عن المستخدم، نستخدم بوابة دفع ولا نعرض خيار التحويل البنكي المباشر.
      </section>
    </main>
  );
}
