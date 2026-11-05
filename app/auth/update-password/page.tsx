"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type RecoveryState = "checking" | "ready" | "invalid";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function verifyRecovery() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: current } = await supabase.auth.getUser();
        if (current.user) {
          if (active) setState("ready");
          return;
        }
        const query = new URLSearchParams(window.location.search);
        const code = query.get("code");
        const tokenHash = query.get("token_hash");
        let verified = false;

        if (code) {
          const { data, error: codeError } = await supabase.auth.exchangeCodeForSession(code);
          verified = !codeError && Boolean(data.user);
        } else if (tokenHash && query.get("type") === "recovery") {
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          verified = !otpError && Boolean(data.user);
        }
        if (active) setState(verified ? "ready" : "invalid");
      } catch {
        if (active) setState("invalid");
      }
    }
    void verifyRecovery();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state !== "ready" || busy) return;
    if (password.length < 8) { setError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف."); return; }
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين."); return; }
    setBusy(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword("");
      setConfirm("");
      await supabase.auth.signOut();
      router.replace("/login?password_reset=1");
      router.refresh();
    } catch {
      setError("تعذر تغيير كلمة المرور الآن. قد يكون الرابط منتهي الصلاحية. اطلب رابطًا جديدًا.");
      setBusy(false);
    }
  }

  return (
    <AuthShell title="تغيير كلمة المرور" description="اختر كلمة مرور جديدة لحماية حساب ضاديوم.">
      <div dir="rtl" className="mx-auto max-w-md space-y-5">
        {state === "checking" && <p role="status" className="rounded-xl bg-[#f0f5ee] p-4 text-sm">نتحقق من رابط الاستعادة...</p>}
        {state === "invalid" && <div role="alert" className="space-y-4 rounded-xl bg-amber-50 p-4 text-sm leading-7">
          <p>رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من بريد حسابك.</p>
          <Link className="font-bold text-[#17665b] underline" href="/forgot-password">أرسل رابط استعادة جديدًا</Link>
        </div>}
        {state === "ready" && <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#274d3f]">
              <LockKeyhole size={16}/> كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input id="new-password" type={visible ? "text" : "password"} dir="ltr"
                autoComplete="new-password" required minLength={8} disabled={busy}
                value={password} onChange={e => setPassword(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-12 text-left outline-none focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10" />
              <button type="button" disabled={busy} onClick={() => setVisible(v => !v)}
                aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={visible}
                className="absolute inset-y-0 left-0 grid w-12 place-items-center text-[#527364]">
                {visible ? <EyeOff size={19} aria-hidden="true"/> : <Eye size={19} aria-hidden="true"/>}
              </button>
            </div>
          </div>
          <label htmlFor="confirm-password" className="block space-y-2">
            <span className="text-sm font-bold text-[#274d3f]">تأكيد كلمة المرور الجديدة</span>
            <input id="confirm-password" type={visible ? "text" : "password"} dir="ltr"
              autoComplete="new-password" minLength={8} required disabled={busy}
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-4 text-left outline-none focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10" />
          </label>
          <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[#174f47] px-5 font-extrabold text-white disabled:opacity-60">
            {busy ? "جارٍ حفظ التغيير..." : "حفظ كلمة المرور الجديدة"}
          </button>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm leading-7 text-rose-900">{error}</p>}
        </form>}
        <Link href="/login" className="inline-flex min-h-11 items-center font-bold text-[#17665b] underline underline-offset-4">العودة إلى الدخول</Link>
      </div>
    </AuthShell>
  );
}
