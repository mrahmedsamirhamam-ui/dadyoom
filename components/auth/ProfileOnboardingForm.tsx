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
  storedRole?: Role | null;
};

export default function ProfileOnboardingForm({ defaultName, defaultRole, defaultCountry, storedRole = null }: Props) {
  const router = useRouter();
  const countries = useMemo(() => getArabicCountryOptions(), []);
  const [fullName, setFullName] = useState(defaultName);
  const [role, setRole] = useState<Role>(storedRole || defaultRole);
  const [country, setCountry] = useState(defaultCountry || "BH");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!storedRole && (role === "teacher" || role === "school" || role === "admin")) {
      setError("تفعيل حساب المعلم أو المدرسة يحتاج موافقة موثقة من إدارة ضاديوم.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, role: storedRole || role, country }),
      });
      const data = (await response.json()) as { error?: string; destination?: string };
      if (!response.ok || !data.destination) throw new Error(data.error || "تعذر إكمال الحساب.");
      router.replace(data.destination);
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
        {storedRole ? (
          <div className="rounded-2xl border border-[#c5d9cb] bg-[#edf5f1] p-4 text-sm font-bold text-[#174f47]">
            دورك المسجل: {storedRole === "admin" ? "مدير المنصة" : roles.find(item => item.value === storedRole)?.label}.
            لا يمكن تغييره من صفحة استكمال الملف.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((item) => {
                const needsApproval = item.value === "teacher" || item.value === "school";
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={needsApproval}
                    onClick={() => setRole(item.value)}
                    className={`rounded-2xl border p-3 text-right transition disabled:cursor-not-allowed disabled:opacity-50 ${role === item.value ? "border-[#174f47] bg-[#edf5f1] text-[#174f47]" : "border-[#ddcfb3] bg-white text-[#5f574d] hover:border-[#b99b58]"}`}
                  >
                    <span className="block font-black">{item.label}</span>
                    <span className="mt-1 block text-[11px] font-semibold opacity-75">
                      {needsApproval ? "يتطلب موافقة الإدارة" : item.note}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs leading-6 text-[#685b47]">
              حسابا المعلم والمدرسة يحتاجان اعتمادًا إداريًا موثقًا قبل تفعيل الصلاحيات.
            </p>
          </>
        )}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">الاسم الكامل</span>
        <input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10" />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">الدولة</span>
        <select required value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10">
          {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div> : null}

      <button disabled={loading} className="w-full rounded-xl bg-[#174f47] px-5 py-3.5 font-black text-white transition hover:bg-[#103f39] disabled:opacity-60">
        {loading ? "جارٍ تجهيز حسابك..." : "ابدأ رحلتي في ضاديوم"}
      </button>
    </form>
  );
}
