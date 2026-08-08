"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

const roles = [
  { value: "student", label: "طالب" },
  { value: "teacher", label: "معلم" },
  { value: "parent", label: "ولي أمر" },
  { value: "school", label: "مدرسة" },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Bahrain");
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
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            country: country.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      // ملحوظة: يُفَضّل الاعتماد على Database Trigger داخل Supabase لإضافة الملف الشخصي
      if (data.session) {
        router.replace(role === "student" ? "/student" : `/${role}`);
        router.refresh();
      } else {
        setSuccess("تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب.");
      }
    } catch (cause: unknown) {
      const message =
        cause instanceof Error
          ? cause.message
          : "حدث خطأ غير متوقع.";

      if (message.includes("already registered")) {
        setError("هذا البريد الإلكتروني مُسجّل بالفعل.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="أنشئ حسابك"
      description="ابدأ رحلتك في ضاديوم خلال دقائق."
    >
      <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
        <TextField
          label="الاسم الكامل"
          value={fullName}
          onChange={setFullName}
          placeholder="اكتب اسمك الكامل"
          autoComplete="name"
        />

        <div>
          <label className="mb-2 block text-sm font-black text-slate-700">
            نوع الحساب
          </label>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRole(item.value)}
                className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                  role === item.value
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-slate-300 text-slate-600 hover:border-teal-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <TextField
          label="الدولة"
          value={country}
          onChange={setCountry}
          placeholder="Bahrain"
        />

        <TextField
          label="البريد الإلكتروني"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          type="email"
          autoComplete="email"
        />

        <TextField
          label="كلمة المرور"
          value={password}
          onChange={setPassword}
          placeholder="8 أحرف على الأقل"
          type="password"
          minLength={8}
          autoComplete="new-password"
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-teal-600 px-5 py-3.5 font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-black text-teal-700 hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  minLength,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "email" | "password";
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}