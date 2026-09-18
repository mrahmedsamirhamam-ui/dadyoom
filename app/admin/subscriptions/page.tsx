import Link from "next/link";
import type { ReactNode } from "react";

import {
  cancelSubscription,
  createAccountWithGift,
  grantExistingSubscription,
} from "./actions";
import { requireOwnerAdmin } from "@/lib/admin/owner-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireOwnerAdmin();
  const params = await searchParams;
  const db = createAdminClient();

  const { data: subscriptions, error } = await db
    .from("edu_subscriptions")
    .select(
      "id,user_id,plan_id,status,provider,current_period_end,grant_source,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) throw error;

  const ids = [...new Set((subscriptions ?? []).map((row) => row.user_id))];
  const profileMap = new Map<
    string,
    { full_name: string; email: string; role: string }
  >();

  if (ids.length) {
    const { data: profiles, error: profilesError } = await db
      .from("profiles")
      .select("id,full_name,email,role")
      .in("id", ids);

    if (profilesError) throw profilesError;

    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, {
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
      });
    }
  }

  const activeCount = (subscriptions ?? []).filter((row) => {
return row.status === "active";
  }).length;

  return (
    <main dir="rtl" className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#9a762c]">لوحة الإدارة الخاصة</p>
          <h1 className="mt-1 text-3xl font-black text-[#123f39]">
            إدارة المشتركين والعروض
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            منح Plus مجانًا، التمديد، الإلغاء، أو إنشاء حساب جديد مع هدية.
          </p>
        </div>
        <Link href="/admin" className="rounded-2xl border px-4 py-2 font-black">
          رجوع للأدمن
        </Link>
      </div>

      {params.ok ? (
        <div className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800">
          {params.ok}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-2xl bg-rose-50 p-4 font-bold text-rose-800">
          {params.error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat title="كل سجلات الاشتراك" value={String(subscriptions?.length ?? 0)} />
        <Stat title="النشط الآن" value={String(activeCount)} />
        <Stat title="الدفع العام" value="Visa / Mastercard" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          action={grantExistingSubscription}
          className="rounded-[2rem] border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black text-[#123f39]">
            منح/تمديد Plus لحساب موجود
          </h2>

          <div className="mt-5 grid gap-4">
            <Field label="البريد الإلكتروني">
              <input
                name="email"
                type="email"
                required
                className="input"
                placeholder="user@example.com"
              />
            </Field>

            <Field label="مدة الهدية">
              <select name="months" defaultValue="1" className="input">
                <option value="1">شهر</option>
                <option value="3">3 شهور</option>
                <option value="6">6 شهور</option>
                <option value="12">سنة</option>
              </select>
            </Field>

            <Field label="ملاحظة / اسم العرض">
              <input
                name="note"
                className="input"
                placeholder="مثال: جائزة مسابقة"
              />
            </Field>

            <button className="rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white">
              منح الاشتراك مجانًا
            </button>
          </div>
        </form>

        <form
          action={createAccountWithGift}
          className="rounded-[2rem] border bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black text-[#123f39]">
            إنشاء حساب جديد + اشتراك هدية
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="الاسم">
              <input name="full_name" required className="input" />
            </Field>

            <Field label="البريد">
              <input name="email" type="email" required className="input" />
            </Field>

            <Field label="نوع الحساب">
              <select name="role" defaultValue="student" className="input">
                <option value="student">طالب</option>
                <option value="child">طفل</option>
                <option value="teacher">معلم</option>
                <option value="parent">ولي أمر</option>
                <option value="school">مدرسة</option>
              </select>
            </Field>

            <Field label="الدولة (رمز من حرفين)">
              <input
                name="country"
                defaultValue="BH"
                maxLength={2}
                className="input uppercase"
              />
            </Field>

            <Field label="كلمة مرور مؤقتة">
              <input
                name="temporary_password"
                type="password"
                minLength={10}
                required
                className="input"
                autoComplete="new-password"
              />
            </Field>

            <Field label="هدية Plus">
              <select name="months" defaultValue="1" className="input">
                <option value="1">شهر</option>
                <option value="3">3 شهور</option>
                <option value="6">6 شهور</option>
                <option value="12">سنة</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="ملاحظة">
                <input
                  name="note"
                  className="input"
                  placeholder="سبب الإضافة أو اسم الجائزة"
                />
              </Field>
            </div>

            <button className="sm:col-span-2 rounded-2xl bg-[#b98b35] px-5 py-3 font-black text-white">
              إنشاء الحساب ومنح الهدية
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-[#123f39]">المشتركون</h2>
          <span className="text-sm font-bold text-slate-500">آخر 500 سجل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="p-3">الحساب</th>
                <th className="p-3">الخطة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">حتى</th>
                <th className="p-3">المصدر</th>
                <th className="p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(subscriptions ?? []).map((row) => {
                const profile = profileMap.get(row.user_id);

                return (
                  <tr key={row.id} className="border-b align-top last:border-0">
                    <td className="p-3">
                      <div className="font-black text-[#123f39]">
                        {profile?.full_name ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {profile?.email ?? row.user_id}
                      </div>
                    </td>
                    <td className="p-3 font-bold">{row.plan_id}</td>
                    <td className="p-3">{row.status}</td>
                    <td className="p-3">{formatDate(row.current_period_end)}</td>
                    <td className="p-3">{row.grant_source || row.provider}</td>
                    <td className="p-3">
                      <div className="flex min-w-56 flex-wrap gap-2">
                        {profile?.email ? (
                          <form action={grantExistingSubscription}>
                            <input type="hidden" name="email" value={profile.email} />
                            <input type="hidden" name="months" value="1" />
                            <input
                              type="hidden"
                              name="note"
                              value="تمديد شهر من غرفة المشتركين"
                            />
                            <button className="rounded-xl border px-3 py-2 text-xs font-black">
                              + شهر
                            </button>
                          </form>
                        ) : null}

                        <form action={cancelSubscription}>
                          <input
                            type="hidden"
                            name="subscription_id"
                            value={row.id}
                          />
                          <button className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                            إلغاء
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!subscriptions?.length ? (
          <div className="py-12 text-center font-bold text-slate-500">
            لا توجد اشتراكات حتى الآن.
          </div>
        ) : null}
      </section>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #d8cbb3;
          border-radius: 14px;
          background: white;
          padding: 12px 14px;
          outline: none;
        }
        .input:focus {
          border-color: #32776d;
          box-shadow: 0 0 0 4px rgba(50,119,109,.10);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#4d4438]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border bg-white p-5 shadow-sm">
      <div className="text-sm font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-[#123f39]">{value}</div>
    </div>
  );
}
