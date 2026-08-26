"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import AuthShell from "@/components/auth/AuthShell";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type AccountRole = "student" | "teacher" | "parent" | "school" | "admin";

function getRoleDestination(role: string | null | undefined) {
  switch (role?.trim().toLowerCase()) {
    case "teacher": return "/teacher";
    case "parent": return "/parent";
    case "school": return "/school";
    case "admin": return "/admin";
    default: return "/student";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      if (!data.user) throw new Error("تعذر قراءة بيانات الحساب بعد تسجيل الدخول.");

      let role: AccountRole | null = null;
      const profileDb = supabase as unknown as SupabaseClient;
      const { data: profile } = await profileDb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      if (profile?.role) role = profile.role.trim().toLowerCase() as AccountRole;
      if (!role) {
        router.replace("/onboarding");
        router.refresh();
        return;
      }
      router.replace(getRoleDestination(role));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تسجيل الدخول. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="مرحبًا بعودتك" description="تابع منهجك ومهاراتك ومحادثاتك مع ضاد من حيث توقفت.">
      <div className="space-y-6">
        <GoogleAuthButton mode="login" />
        <div className="flex items-center gap-3 text-xs font-bold text-[#8a8074]"><span className="h-px flex-1 bg-[#e5d8bf]" /><span>أو بالبريد الإلكتروني</span><span className="h-px flex-1 bg-[#e5d8bf]" /></div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} placeholder="name@example.com" autoComplete="email" />
          <Field label="كلمة المرور" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#174f47] px-5 py-3.5 font-black text-white transition hover:bg-[#103f39] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}</button>
        </form>
      </div>
      <p className="mt-6 text-center text-sm text-[#746b60]">ليس لديك حساب؟ <Link href="/signup" className="font-black text-[#174f47] hover:underline">أنشئ حسابًا</Link></p>
    </AuthShell>
  );
}

function Field({ label, type, value, onChange, placeholder, autoComplete }: { label: string; type: "email" | "password"; value: string; onChange: (value: string) => void; placeholder: string; autoComplete: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-[#4d4438]">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none transition focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10" /></label>;
}
