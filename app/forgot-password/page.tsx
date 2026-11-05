"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = new URL("/auth/update-password", window.location.origin).toString();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );
      if (resetError) throw resetError;
      // Avoid leaking whether an address is registered.
      setSent(true);
    } catch {
      setError("تعذر إرسال الطلب الآن. تحقق من البريد وحاول بعد قليل.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="استعادة كلمة المرور" description="اكتب بريد حسابك وسنطلب إرسال رابط يساعدك على العودة إلى ضاديوم.">
      <div className="mx-auto max-w-md space-y-5" dir="rtl">
        {sent ? (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-8 text-emerald-900">
            إذا كان هذا البريد مرتبطًا بحساب قابل للاستعادة، فستصلك رسالة تتضمن رابط تغيير كلمة المرور.
            افحص صندوق البريد والرسائل غير المرغوبة.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label htmlFor="recover-email" className="block space-y-2">
              <span className="flex items-center gap-2 text-sm font-bold"><Mail size={16}/> البريد الإلكتروني</span>
              <input id="recover-email" type="email" dir="ltr" inputMode="email"
                autoComplete="email" value={email} onChange={event => setEmail(event.target.value)}
                disabled={busy} required placeholder="name@example.com"
                className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-4 text-left outline-none focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10"/>
            </label>
            <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[#174f47] px-4 font-extrabold text-white disabled:opacity-60">
              {busy ? "جارٍ إرسال الطلب..." : "أرسل رابط الاستعادة"}
            </button>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm leading-7 text-rose-900">{error}</p>}
          </form>
        )}
        <Link href="/login" className="inline-flex min-h-11 items-center font-bold text-[#17665b] underline underline-offset-4">العودة إلى تسجيل الدخول</Link>
      </div>
    </AuthShell>
  );
}
