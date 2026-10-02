import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  savePlatformPayoutProfile,
} from "./actions";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(3);
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
    redirect("/student");
  }

  const admin = createAdminClient();

  const [
    payoutResult,
    earningsResult,
  ] = await Promise.all([
    admin
      .from("edu_platform_payout_profile")
      .select(
        "iban,account_holder_name,bank_name,swift_bic,country,updated_at",
      )
      .eq("id", "default")
      .maybeSingle(),

    admin
      .from("edu_teacher_earnings")
      .select(
        "gross_amount,platform_fee,net_amount,currency,status",
      ),
  ]);

  const payout = payoutResult.data;
  const earnings = earningsResult.data ?? [];

  const activeRows = earnings.filter(
    (item) =>
      item.status !== "reversed",
  );

  const grossSales = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.gross_amount ?? 0),
    0,
  );

  const platformFees = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.platform_fee ?? 0),
    0,
  );

  const teacherNet = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.net_amount ?? 0),
    0,
  );

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-5xl space-y-6 px-4 py-8"
    >
      <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
        <p className="text-sm font-black text-[#f3d187]">
          إدارة ضاديوم
        </p>

        <h1 className="mt-2 text-3xl font-black">
          عمولات الدورات ومدفوعات BPay
        </h1>

        <p className="mt-3 max-w-3xl leading-8 text-white/85">
          BPay الحالي يدفع مباشرة إلى المعلم. هذه الصفحة تعرض السجل المحاسبي لضاديوم فقط؛ لا يوجد Split آلي ولا سحب تلقائي ولا تنفيذ دفع حقيقي من هنا.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          title="إجمالي مبيعات الدورات"
          value={grossSales}
        />
        <Metric
          title="عمولة ضاديوم المسجلة"
          value={platformFees}
        />
        <Metric
          title="صافي المعلمين بعد العمولة"
          value={teacherNet}
        />
        <Metric
          title="عدد عمليات البيع"
          value={activeRows.length}
          isCount
        />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-black text-amber-950">
          تنبيه محاسبي
        </h2>

        <p className="mt-2 text-sm leading-7 text-amber-950">
          قيمة عمولة ضاديوم أعلاه <strong>مسجلة محاسبيًا</strong> وليست دليلًا على أن المبلغ تم تحصيله من المعلم. مع BPay اليدوي يستلم المعلم المبلغ كاملًا أولًا، ثم تحتاج عمولة المنصة إلى تسوية منفصلة إذا أردنا تحصيلها فعليًا.
        </p>
      </section>

      <form
        action={
          savePlatformPayoutProfile
        }
        className="rounded-[2rem] border bg-white p-5 sm:p-6"
      >
        <h2 className="text-xl font-black text-[#123f39]">
          بيانات استلام ضاديوم الخاصة
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-600">
          هذه البيانات داخلية للإدارة فقط ولا تظهر للطلاب أو المعلمين. لا يؤدي حفظها إلى تنفيذ أي تحويل مالي.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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

          <label className="space-y-1">
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

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-black text-[#123f39]">
          ملخص المحاسبة
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-right">
                <th className="p-3">البند</th>
                <th className="p-3">القيمة</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">
                  مبيعات مؤكدة
                </td>
                <td className="p-3 font-black">
                  {money(grossSales)} BHD
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-3">
                  عمولة المنصة المسجلة
                </td>
                <td className="p-3 font-black text-amber-700">
                  {money(platformFees)} BHD
                </td>
              </tr>
              <tr>
                <td className="p-3">
                  صافي المعلمين
                </td>
                <td className="p-3 font-black text-emerald-700">
                  {money(teacherNet)} BHD
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({
  title,
  value,
  isCount = false,
}: {
  title: string;
  value: number;
  isCount?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm font-bold text-slate-600">
        {title}
      </div>
      <div className="mt-2 text-2xl font-black text-[#123f39]">
        {isCount
          ? Math.trunc(value)
          : `${value.toFixed(3)} BHD`}
      </div>
    </div>
  );
}
