"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { getArabicCountryOptions } from "@/lib/countries";
import type { SelfSignupRole } from "@/lib/auth/role-destination.mjs";

type Mode = "login" | "signup";

const roleOptions: ReadonlyArray<{ value: SelfSignupRole; label: string; detail: string }> = [
  { value: "student", label: "طالب", detail: "أتعلم وأتدرب" },
  { value: "teacher", label: "معلم", detail: "أشرح وأتابع" },
  { value: "parent", label: "ولي أمر", detail: "أتابع أبنائي" },
  { value: "school", label: "مدرسة", detail: "أدير مدرستي" },
  { value: "child", label: "طفل", detail: "أبدأ رحلتي" },
];

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد منهما وحاول مجددًا.";
  }
  if (lower.includes("email not confirmed")) {
    return "يرجى تأكيد البريد الإلكتروني أولًا من رسالة التفعيل.";
  }
  if (lower.includes("already registered")) {
    return "هذا البريد مسجل من قبل. انتقل إلى تسجيل الدخول.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "تكررت المحاولات في وقت قصير. جرّب بعد قليل.";
  }
  // Do not echo arbitrary provider details or system errors into a public form.
  if (message.startsWith("تم") || message.startsWith("تعذر") || message.startsWith("خدمة") ||
      message.startsWith("البريد") || message.startsWith("يرجى")) return message;
  return "تعذر إكمال العملية الآن. تحقق من البيانات واتصالك بالإنترنت ثم حاول مجددًا.";
}

async function passwordSignIn(email: string, password: string) {
  // Preserve the existing server-side throttling and lockout. Never bypass it
  // by calling signInWithPassword from the browser.
  const response = await fetch("/api/auth/password-login", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  let payload: { error?: string; access_token?: string; refresh_token?: string } = {};
  try {
    payload = await response.json() as typeof payload;
  } catch {
    throw new Error("تعذر التواصل مع خدمة تسجيل الدخول.");
  }
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(payload.error || "تعذر تسجيل الدخول. حاول مرة أخرى.");
  }
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (error || !data.user) throw error ?? new Error("تعذر إنشاء جلسة الدخول.");
}

async function trustedDestination(): Promise<string> {
  const response = await fetch("/api/auth/destination", {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("تعذر تحديد صفحة حسابك حاليًا. يمكنك المحاولة مرة أخرى.");
  const result = await response.json() as { destination?: string };
  // Never follow an untrusted external URL or arbitrary browser metadata.
  const allowed = ["/student", "/child", "/teacher", "/parent", "/school", "/admin", "/onboarding", "/account/role-request"];
  if (!result.destination || !allowed.includes(result.destination)) {
    throw new Error("تعذر تحديد صفحة حسابك حاليًا. يمكنك المحاولة مرة أخرى.");
  }
  return result.destination;
}

export default function EmailPasswordAuthForm({ mode, passwordWasReset = false }: { mode: Mode; passwordWasReset?: boolean }) {
  const signup = mode === "signup";
  const router = useRouter();
  const countries = useMemo(() => getArabicCountryOptions(), []);

  const [role, setRole] = useState<SelfSignupRole>("student");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("BH");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !password) { setError("أدخل البريد الإلكتروني وكلمة المرور."); return; }
    // Existing users may have valid passwords shorter than the *new-signup*
    // minimum. Never block password login with client-only length rules.
    if (signup && password.length < 8) {
      setError("أنشئ كلمة مرور من ثمانية أحرف على الأقل."); return;
    }
    if (signup && (!cleanName || !country)) {
      setError("أكمل الاسم ونوع الحساب والدولة."); return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      if (!signup) {
        setPhase("نتحقق من بيانات الدخول بأمان...");
        await passwordSignIn(cleanEmail, password);
        setPhase("نفتح صفحتك المناسبة...");
        const destination = await trustedDestination();
        router.replace(destination);
        router.refresh();
        return;
      }

      setPhase("ننشئ حسابك...");
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName, role, country },
        },
      });
      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("تعذر إنشاء حسابك الآن.");

      if (!data.session) {
        setPhase("");
        setSuccess("وصل طلب التسجيل. راجع بريدك الإلكتروني ورسائل البريد غير المرغوب، وأكّد الحساب من رابط التفعيل إن وصلك.");
        setPassword("");
        return;
      }

      // Role/profile creation must go through a server endpoint that verifies
      // the authenticated user. No browser-side upsert of the profiles table.
      setPhase("نجهّز لوحة حسابك...");
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: cleanName, role, country }),
      });
      const completed = await response.json() as { destination?: string; error?: string };
      if (!response.ok) {
        setSuccess("تم إنشاء الحساب، لكن الملف الشخصي يحتاج إكمالًا.");
        throw new Error(completed.error || "تعذر إكمال الملف الشخصي. افتح صفحة استكمال الحساب.");
      }
      const destination = await trustedDestination();
      router.replace(destination);
      router.refresh();
    } catch (cause) {
      setError(friendlyError(cause instanceof Error ? cause.message : "تعذر إكمال العملية."));
    } finally {
      setPhase("");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={signup ? "إنشاء حساب جديد" : "تسجيل الدخول"}
      description={signup ? "اختر نوع الحساب وأدخل بياناتك مرة واحدة." : "أدخل بياناتك إذا لم تكن مسجّلًا بالفعل."}
    >
      <div dir="rtl" className="mx-auto w-full max-w-lg space-y-7">
        {passwordWasReset && !signup && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold leading-7 text-emerald-900">تم تغيير كلمة المرور. يمكنك تسجيل الدخول باستخدام الكلمة الجديدة.</p>}
        <form onSubmit={submit} aria-busy={busy} className="space-y-4">
          {signup && (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-extrabold text-[#274d3f]">سأسجّل في ضاديوم بصفتي</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {roleOptions.map(item => (
                    <button key={item.value} type="button" disabled={busy}
                      aria-pressed={role === item.value}
                      onClick={() => setRole(item.value)}
                      className={"min-h-16 rounded-xl border-2 px-3 py-2 text-right transition focus-visible:outline-4 focus-visible:outline-[#d2ac58] " +
                        (role === item.value ? "border-[#17665b] bg-[#e9f5ed] text-[#174f47]" : "border-[#e2e9e0] bg-white text-[#52695e] hover:border-[#aac4b1]")}>
                      <strong className="block text-sm">{item.label}</strong>
                      <span className="mt-1 block text-[11px]">{item.detail}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {role === "child" && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-950">
                حساب الطفل يحتاج إشراف ولي الأمر وموافقته قبل استخدام الخدمات التي تجمع بياناته.
              </p>}
              <label className="block space-y-1.5" htmlFor="auth-full-name">
                <span className="flex items-center gap-2 text-sm font-bold text-[#274d3f]"><UserRound size={16}/> الاسم الكامل</span>
                <input id="auth-full-name" type="text" autoComplete="name" value={fullName}
                  onChange={event => setFullName(event.target.value)} maxLength={120} required disabled={busy}
                  placeholder="الاسم الذي تود ظهوره في حسابك"
                  className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-4 text-base outline-none transition focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10"/>
              </label>
              <label className="block space-y-1.5" htmlFor="auth-country">
                <span className="text-sm font-bold text-[#274d3f]">دولتك أو دولة المنهج الذي تدرسه</span>
                <select id="auth-country" value={country} onChange={event => setCountry(event.target.value)} required disabled={busy}
                  className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-4 text-base outline-none focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10">
                  {countries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
              </label>
            </>
          )}

          <label className="block space-y-1.5" htmlFor="auth-email">
            <span className="flex items-center gap-2 text-sm font-bold text-[#274d3f]"><Mail size={16}/> البريد الإلكتروني</span>
            <input id="auth-email" type="email" dir="ltr" autoComplete="email" inputMode="email"
              value={email} onChange={event => setEmail(event.target.value)} required disabled={busy}
              placeholder="name@example.com"
              className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-4 text-left text-base outline-none transition focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10"/>
          </label>
          <div className="space-y-1.5">
            <label htmlFor="auth-password" className="flex items-center gap-2 text-sm font-bold text-[#274d3f]"><LockKeyhole size={16}/> كلمة المرور</label>
            <div className="relative">
              <input id="auth-password" type={showPassword ? "text" : "password"} dir="ltr"
                autoComplete={signup ? "new-password" : "current-password"}
                value={password} onChange={event => setPassword(event.target.value)} required
                minLength={signup ? 8 : undefined} disabled={busy}
                placeholder={signup ? "ثمانية أحرف على الأقل" : "كلمة مرور حسابك"}
                className="min-h-12 w-full rounded-xl border border-[#cbd9cb] bg-white px-12 py-3 text-left text-base outline-none transition focus:border-[#17665b] focus:ring-4 focus:ring-[#17665b]/10"/>
              <button type="button" onClick={() => setShowPassword(current => !current)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                aria-pressed={showPassword} disabled={busy}
                className="absolute inset-y-0 left-0 grid min-h-12 w-12 place-items-center rounded-l-xl text-[#537464] hover:bg-[#eef5ed] focus-visible:outline-2 focus-visible:outline-[#17665b]">
                {showPassword ? <EyeOff size={19} aria-hidden="true"/> : <Eye size={19} aria-hidden="true"/>}
              </button>
            </div>
            {signup && <p className="text-xs leading-6 text-[#61796c]">اختر كلمة مرور طويلة يصعب تخمينها، ولا تشاركها مع الآخرين.</p>}
          </div>

          {!signup && <div className="text-left">
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-bold text-[#17665b] underline underline-offset-4">
              نسيت كلمة المرور؟
            </Link>
          </div>}

          <button type="submit" disabled={busy}
            className="min-h-12 w-full rounded-xl bg-[#174f47] px-6 py-3 text-base font-extrabold text-white shadow-md shadow-[#174f47]/15 transition hover:bg-[#0d3e35] focus-visible:outline-4 focus-visible:outline-[#d2ac58] disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "جارٍ التنفيذ..." : signup ? "إنشاء حسابي" : "الدخول إلى حسابي"}
          </button>
          {phase && <p role="status" aria-live="polite" className="rounded-xl bg-[#eaf5f0] p-3 text-center text-sm font-semibold text-[#174f47]">{phase}</p>}
          {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-7 text-emerald-900">{success}
            {success.includes("إكمالًا") && <Link href="/onboarding" className="mr-2 font-bold underline">أكمل حسابك</Link>}
          </div>}
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-7 text-rose-900">{error}</p>}
        </form>

        <div className="space-y-4 border-t border-[#e4e9df] pt-6">
          <p className="text-center text-xs font-semibold text-[#718376]">أو استخدم حساب Google</p>
          <GoogleAuthButton mode={mode} fullName={fullName} role={role} country={country}/>
        </div>

        <nav aria-label={signup ? "لديك حساب بالفعل" : "إنشاء حساب جديد"}
          className="mt-8 border-t border-[#e4e9df] pt-6">
          <Link href={signup ? "/login" : "/signup"}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-[#b7cfc0] bg-white px-5 py-3 text-center text-sm font-extrabold text-[#174f47] transition hover:bg-[#edf5f0] focus-visible:outline-4 focus-visible:outline-[#d2ac58]">
            {signup ? "لدي حساب بالفعل — تسجيل الدخول" : "ليس لدي حساب — إنشاء حساب جديد"}
          </Link>
        </nav>
      </div>
    </AuthShell>
  );
}
