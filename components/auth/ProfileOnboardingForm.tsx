"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getArabicCountryOptions } from "@/lib/countries";

const roles = [
  { value: "child", label: "طفل", note: "أتعلم من الصغر" },
  { value: "student", label: "طالب", note: "أتعلم وأتدرب" },
  { value: "teacher", label: "معلم", note: "أدرّس وأتابع طلابي" },
  { value: "parent", label: "ولي أمر", note: "أتابع تقدّم أبنائي" },
  { value: "school", label: "مدرسة", note: "أدير المعلمين والطلاب" },
] as const;

type Role = (typeof roles)[number]["value"] | "admin";

type Props = {
  defaultName: string;
  defaultRole: Role;
  defaultCountry: string;
  lockedRole?: boolean;
};

export default function ProfileOnboardingForm({ defaultName, defaultRole, defaultCountry, lockedRole = false }: Props) {
  const router = useRouter();
  const countries = useMemo(() => getArabicCountryOptions(), []);
  const [fullName, setFullName] = useState(defaultName);
  const [role, setRole] = useState<Role>(defaultRole);
  const [country, setCountry] = useState(defaultCountry || "BH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, role, country }),
      });
      const data = (await response.json()) as { error?: string; destination?: string; pendingApproval?: boolean };
      if (!response.ok) throw new Error(data.error || "تعذر إكمال الحساب.");
      // Re-resolve the role from the authenticated server, never assume student.
      router.replace(data.pendingApproval ? "/account/role-status" : "/my");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إكمال الحساب.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" dir="rtl">
      <div>
        <div className="mb-2 text-sm font-black text-[#4d4438]">نوع الحساب</div>
        {lockedRole ? (
          <div role="status" className="rounded-2xl border border-[#b8d5c7] bg-[#edf5f1] px-4 py-3 text-sm leading-7">
            <strong>نوع حسابك الحالي: {role === "admin" ? "مدير" : roles.find(item => item.value === role)?.label || "حساب مسجل"}</strong>
            <p className="text-[#42655a]">يمكنك إكمال اسمك ودولتك دون تغيير صلاحيات الحساب. لتغيير نوع الحساب تواصل مع إدارة ضاديوم.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {roles.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={role === item.value}
                onClick={() => setRole(item.value)}
                className={`min-h-14 rounded-2xl border p-3 text-right transition ${role === item.value ? "border-[#174f47] bg-[#edf5f1] text-[#174f47]" : "border-[#ddcfb3] bg-white text-[#5f574d] hover:border-[#b99b58]"}`}
              >
                <span className="block font-black">{item.label}</span>
                <span className="mt-1 block text-[11px] font-semibold opacity-75">{item.note}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">الاسم الكامل</span>
        <input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="min-h-12 w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10" />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">الدولة</span>
        <select required value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10">
          {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>

      {error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div> : null}

      <button disabled={loading} className="min-h-12 w-full rounded-xl bg-[#174f47] px-5 py-3.5 font-black text-white transition hover:bg-[#103f39] disabled:opacity-60">
        {loading ? "جارٍ تجهيز حسابك..." : "ابدأ رحلتي في ضاديوم"}
      </button>
    </form>
  );
}
