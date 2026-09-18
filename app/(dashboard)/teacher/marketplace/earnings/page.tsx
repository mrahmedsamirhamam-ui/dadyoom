import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function money(value: unknown) {
  return Number(value ?? 0).toFixed(3);
}

export default async function TeacherEarningsPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.role
      ?.trim()
      .toLowerCase() ?? "";

  if (
    role !== "teacher" &&
    role !== "admin"
  ) {
    redirect("/student");
  }

  const {
    data: earnings,
  } = await supabase
    .from("edu_teacher_earnings")
    .select(
      "id,gross_amount,platform_fee,net_amount,currency,status,payout_reference,created_at,paid_at",
    )
    .eq("teacher_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const {
    data: payout,
  } = await supabase
    .from(
      "edu_teacher_payout_profiles",
    )
    .select(
      "paypal_email,iban,account_holder_name,bank_name,swift_bic,country,is_verified",
    )
    .eq("teacher_id", user.id)
    .maybeSingle();

  let routing:
    | {
        onboarding_status?: string;
        payout_enabled?: boolean;
      }
    | null = null;

  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL
      ?.trim();
  const key =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY
      ?.trim();

  if (url && key) {
    const admin =
      createAdminClient(
        url,
        key,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

    const { data } =
      await admin
        .from(
          "edu_teacher_payout_routing",
        )
        .select(
          "onboarding_status,payout_enabled",
        )
        .eq(
          "teacher_id",
          user.id,
        )
        .maybeSingle();

    routing = data;
  }

  const rows =
    earnings ?? [];

  const total =
    rows.reduce(
      (sum, item) =>
        sum +
        Number(
          item.net_amount,
        ),
      0,
    );

  const available =
    rows
      .filter(
        (item) =>
          item.status ===
          "available",
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.net_amount,
          ),
        0,
      );

  const pending =
    rows
      .filter(
        (item) =>
          item.status ===
          "pending",
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.net_amount,
          ),
        0,
      );

  const paid =
    rows
      .filter(
        (item) =>
          item.status ===
          "paid",
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.net_amount,
          ),
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
          الأرباح والتحويلات
        </h1>

        <p className="mt-3 leading-8 text-white/85">
          هذه الأرقام وبيانات الاستلام لا يراها الطلاب أو المعلمون الآخرون.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="إجمالي صافي الأرباح" value={total} />
        <Metric title="مستحق" value={available} />
        <Metric title="قيد التسوية" value={pending} />
        <Metric title="تم تحويله" value={paid} />
      </section>

      <section className="rounded-[2rem] border bg-white p-5">
        <h2 className="text-xl font-black text-[#123f39]">
          حالة استلام الأموال
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info
            label="بيانات PayPal / البنك"
            value={
              payout
                ? "محفوظة في حسابك الخاص"
                : "لم تُحفظ بعد"
            }
          />
          <Info
            label="تحويل Tap التلقائي"
            value={
              routing?.payout_enabled
                ? "مفعّل"
                : routing?.onboarding_status === "pending"
                  ? "KYC قيد المراجعة"
                  : "غير مفعّل بعد"
            }
          />
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          التحويل التلقائي إلى البنك يحتاج موافقة KYC من مزود الدفع قبل تفعيل Destination الخاص بالمعلم.
        </p>

        <Link
          href="/teacher/marketplace"
          className="mt-4 inline-flex rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white"
        >
          تعديل بيانات الاستلام
        </Link>
      </section>

      <section className="rounded-[2rem] border bg-white p-5">
        <h2 className="text-xl font-black text-[#123f39]">
          سجل الأرباح
        </h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-right">
                <th className="p-3">التاريخ</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">عمولة ضاديوم</th>
                <th className="p-3">صافي المعلم</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(
                (item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                  >
                    <td className="p-3">
                      {new Date(
                        item.created_at,
                      ).toLocaleDateString(
                        "ar-BH",
                      )}
                    </td>
                    <td className="p-3">
                      {money(
                        item.gross_amount,
                      )}{" "}
                      {item.currency}
                    </td>
                    <td className="p-3">
                      {money(
                        item.platform_fee,
                      )}{" "}
                      {item.currency}
                    </td>
                    <td className="p-3 font-black">
                      {money(
                        item.net_amount,
                      )}{" "}
                      {item.currency}
                    </td>
                    <td className="p-3">
                      {item.status ===
                      "paid"
                        ? "تم التحويل"
                        : item.status ===
                            "pending"
                          ? "قيد التسوية"
                          : item.status ===
                              "reversed"
                            ? "مُرتجع"
                            : "مستحق"}
                    </td>
                  </tr>
                ),
              )}

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
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm font-bold text-slate-600">
        {title}
      </div>
      <div className="mt-2 text-2xl font-black text-[#123f39]">
        {value.toFixed(3)} BHD
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
    <div className="rounded-2xl bg-[#fff8e8] p-4">
      <div className="text-xs font-black text-[#956a21]">
        {label}
      </div>
      <div className="mt-2 font-black text-[#123f39]">
        {value}
      </div>
    </div>
  );
}
