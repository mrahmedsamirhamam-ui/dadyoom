import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(3);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "-";

  const date = new Date(
    timestamp + 3 * 60 * 60 * 1000,
  );

  const pad = (part: number) =>
    String(part).padStart(2, "0");

  return [
    pad(date.getUTCDate()),
    pad(date.getUTCMonth() + 1),
    date.getUTCFullYear(),
  ].join("/");
}

export default async function TeacherEarningsPage() {
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

  const role = profile?.role
    ?.trim()
    .toLowerCase() ?? "";

  if (
    role !== "teacher" &&
    role !== "admin"
  ) {
    redirect("/student");
  }

  const [
    earningsResult,
    payoutResult,
  ] = await Promise.all([
    supabase
      .from("edu_teacher_earnings")
      .select(
        "id,gross_amount,platform_fee,net_amount,currency,status,payout_reference,created_at,paid_at",
      )
      .eq("teacher_id", user.id)
      .order("created_at", {
        ascending: false,
      }),
    supabase
      .from("edu_teacher_payout_profiles")
      .select(
        "bpay_mobile,bpay_name,is_verified",
      )
      .eq("teacher_id", user.id)
      .maybeSingle(),
  ]);

  const rows = earningsResult.data ?? [];
  const payout = payoutResult.data;

  const activeRows = rows.filter(
    (item) =>
      item.status !== "reversed",
  );

  const totalGross = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.gross_amount ?? 0),
    0,
  );

  const totalPlatformFee = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.platform_fee ?? 0),
    0,
  );

  const totalNet = activeRows.reduce(
    (sum, item) =>
      sum + Number(item.net_amount ?? 0),
    0,
  );

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl space-y-6 px-4 py-8"
    >
      <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
        <div className="text-sm font-black text-[#f3d187]">
          حساب المعلم الخاص
        </div>

        <h1 className="mt-2 text-3xl font-black">
          مبيعات الدورات وعمولة ضاديوم
        </h1>

        <p className="mt-3 leading-8 text-white/85">
          في BPay يدفع الطالب لك مباشرة. ضاديوم لا يحتجز المبلغ ولا يحوّل لك 85% لاحقًا؛ النظام يسجل فقط 15% كعمولة للمنصة و85% كصافي لك بعد العمولة.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          title="إجمالي ما دفعه الطلاب"
          value={totalGross}
        />
        <Metric
          title="عمولة ضاديوم المسجلة"
          value={totalPlatformFee}
        />
        <Metric
          title="صافي المعلم بعد العمولة"
          value={totalNet}
        />
        <Metric
          title="عدد المبيعات"
          value={activeRows.length}
          isCount
        />
      </section>

      <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-black text-[#123f39]">
          حالة BPay
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info
            label="استقبال BPay"
            value={
              payout?.bpay_mobile
                ? `مفعّل على ${payout.bpay_mobile}`
                : "لم تضف رقم BPay بعد"
            }
          />
          <Info
            label="طريقة تقسيم البيع"
            value="15% لضاديوم / 85% للمعلم"
          />
        </div>

        <p className="mt-4 text-sm leading-7 text-amber-950">
          مهم: BPay اليدوي لا ينفذ Split تلقائيًا بين حسابين. المبلغ يصل إلى المعلم مباشرة، وعمولة ضاديوم هنا سجل محاسبي مستحق وليست مبلغًا تم سحبه تلقائيًا.
        </p>

        <Link
          href="/teacher/marketplace"
          prefetch={false}
          className="mt-4 inline-flex rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white"
        >
          تعديل بيانات BPay
        </Link>
      </section>

      <section className="rounded-[2rem] border bg-white p-5">
        <h2 className="text-xl font-black text-[#123f39]">
          سجل المبيعات
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-right">
                <th className="p-3">التاريخ</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">عمولة ضاديوم 15%</th>
                <th className="p-3">صافي المعلم 85%</th>
                <th className="p-3">السجل</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="p-3">
                    {money(item.gross_amount)}{" "}
                    {item.currency}
                  </td>
                  <td className="p-3 font-black text-amber-700">
                    {money(item.platform_fee)}{" "}
                    {item.currency}
                  </td>
                  <td className="p-3 font-black text-emerald-700">
                    {money(item.net_amount)}{" "}
                    {item.currency}
                  </td>
                  <td className="p-3">
                    {item.status === "reversed"
                      ? "ملغي / مرتجع"
                      : "عملية مؤكدة"}
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500"
                  >
                    لا توجد مبيعات بعد.
                  </td>
                </tr>
              ) : null}
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-200">
      <div className="text-xs font-black text-[#956a21]">
        {label}
      </div>
      <div className="mt-2 font-black text-[#123f39]">
        {value}
      </div>
    </div>
  );
}
