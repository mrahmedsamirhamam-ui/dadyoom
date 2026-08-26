"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { getArabicCountryOptions } from "@/lib/countries";

const roles = [
  { value: "student", label: "طالب", note: "أتعلم وأتدرب" },
  { value: "teacher", label: "معلم", note: "أدرّس وأتابع طلابي" },
  { value: "parent", label: "ولي أمر", note: "أتابع تقدّم أبنائي" },
  { value: "school", label: "مدرسة", note: "أدير المعلمين والطلاب" },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const countries = useMemo(() => getArabicCountryOptions(), []);
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("BH");
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role, country } },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        const profileResponse = await fetch("/api/auth/complete-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: fullName.trim(), role, country }),
        });
        const profileData = (await profileResponse.json()) as { error?: string; destination?: string };
        if (!profileResponse.ok) throw new Error(profileData.error || "تعذر إكمال ملف الحساب.");
        router.replace(profileData.destination || (role === "student" ? "/student" : `/${role}`));
        router.refresh();
      } else {
        setSuccess("تم إنشاء الحساب. راجع بريدك لتأكيد العنوان ثم سجّل الدخول.");
      }
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "حدث خطأ غير متوقع.";
      setError(message.includes("already registered") ? "هذا البريد الإلكتروني مُسجّل بالفعل." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="أنشئ حسابك" description="اختر دورك ودولتك، ثم ابدأ أول تجربة تعليمية في دقائق.">
      <div className="space-y-6" dir="rtl">
        <div>
          <label className="mb-2 block text-sm font-black text-[#4d4438]">نوع الحساب</label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((item) => (
              <button key={item.value} type="button" onClick={() => setRole(item.value)} className={`rounded-2xl border p-3 text-right transition ${role === item.value ? "border-[#174f47] bg-[#edf5f1] text-[#174f47] shadow-sm" : "border-[#ddcfb3] bg-white text-[#5f574d] hover:border-[#b99b58]"}`}>
                <span className="block font-black">{item.label}</span>
                <span className="mt-1 block text-[11px] font-semibold opacity-75">{item.note}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#4d4438]">الاسم الكامل</span>
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none transition focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10" placeholder="اكتب اسمك الكامل" />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#4d4438]">الدولة</span>
          <select required value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none transition focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10">
            {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
          <p className="mt-2 text-xs leading-6 text-[#81776b]">نستخدم الدولة لتقديم المنهج المحلي عند توفره، بينما تبقى المهارات وضاد متاحين للجميع.</p>
        </label>

        <GoogleAuthButton mode="signup" fullName={fullName} role={role} country={country} />

        <div className="flex items-center gap-3 text-xs font-bold text-[#8a8074]"><span className="h-px flex-1 bg-[#e5d8bf]" /><span>أو بالبريد الإلكتروني</span><span className="h-px flex-1 bg-[#e5d8bf]" /></div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} placeholder="name@example.com" autoComplete="email" />
          <Field label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="8 أحرف على الأقل" minLength={8} autoComplete="new-password" />
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
          {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{success}</div> : null}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#174f47] px-5 py-3.5 font-black text-white transition hover:bg-[#103f39] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب بالبريد"}</button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-[#746b60]">لديك حساب بالفعل؟ <Link href="/login" className="font-black text-[#174f47] hover:underline">تسجيل الدخول</Link></p>
    </AuthShell>
  );
}

function Field({ label, value, onChange, placeholder, type, minLength, autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type: "email" | "password"; minLength?: number; autoComplete: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-[#4d4438]">{label}</span><input required type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} minLength={minLength} autoComplete={autoComplete} className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none transition focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10" /></label>;
}
