"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";
import { getArabicCountryOptions } from "@/lib/countries";

type Mode = "login" | "signup";

function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "";
  }
  return value;
}

const roleDestinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

function authMessage(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (lower.includes("email not confirmed")) {
    return "فعّل بريدك الإلكتروني أولًا ثم حاول تسجيل الدخول.";
  }

  if (lower.includes("user already registered")) {
    return "هذا البريد مسجل بالفعل. استخدم تسجيل الدخول.";
  }

  if (lower.includes("password")) {
    return "تحقق من كلمة المرور. يجب أن تكون 8 أحرف على الأقل.";
  }

  return message;
}


// DADYOOM_SERVER_THROTTLED_PASSWORD_LOGIN_V1
async function dadyoomServerThrottledSignIn(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  email: string,
  password: string
) {
  const response = await fetch(
    "/api/auth/password-login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({ email, password }),
    }
  );

  const raw = await response.text();
  let payload: {
    error?: string;
    access_token?: string;
    refresh_token?: string;
  } = {};

  if (raw) {
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      payload = {
        error: response.ok
          ? "وصل رد غير صالح من خدمة تسجيل الدخول."
          : `تعذر تسجيل الدخول (HTTP ${response.status}).`,
      };
    }
  } else if (!response.ok) {
    payload = {
      error: `تعذر تسجيل الدخول (HTTP ${response.status}).`,
    };
  }

  if (
    !response.ok ||
    !payload.access_token ||
    !payload.refresh_token
  ) {
    return {
      data: {
        user: null,
        session: null,
      },
      error: new Error(
        payload.error ||
          "تعذر تسجيل الدخول. حاول مرة أخرى."
      ),
    };
  }

  return supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
}
export default function EmailPasswordAuthForm({
  mode,
  nextPath = "",
}: {
  mode: Mode;
  nextPath?: string;
}) {
  const router = useRouter();
  const countries = useMemo(() => getArabicCountryOptions(), []);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [country, setCountry] = useState("BH");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function resolveDestination(
    userId: string,
    metadataRole?: string,
  ) {
    const supabase = getSupabaseBrowserClient();

    const { data } = await supabase
      .from("profiles")
      .select("role,onboarding_completed,grade_number")
      .eq("id", userId)
      .maybeSingle();

    const resolvedRole =
      data?.role ||
      metadataRole ||
      (mode === "signup" ? role : "");

    const studentLike =
      resolvedRole === "student" ||
      resolvedRole === "child";

    const gradeNumber =
      Number(data?.grade_number);

    if (
      studentLike &&
      (
        data?.onboarding_completed !== true ||
        !Number.isInteger(gradeNumber) ||
        gradeNumber < 1 ||
        gradeNumber > 12
      )
    ) {
      return "/onboarding";
    }

    return (
      roleDestinations[resolvedRole] ||
      (resolvedRole ? "/student" : "/onboarding")
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("اكتب البريد الإلكتروني وكلمة المرور.");
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    if (
      mode === "signup" &&
      (!fullName.trim() || !role || !country.trim())
    ) {
      setError("أكمل الاسم ونوع الحساب والدولة.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "login") {
        setPhase("جارٍ تسجيل الدخول…");

        const { data, error: signInError } =
          await dadyoomServerThrottledSignIn(
          supabase,
          cleanEmail,
          password
        );

        if (signInError) {
          throw signInError;
        }

        if (!data.user) {
          throw new Error("لم يتم إنشاء جلسة دخول.");
        }

        setPhase("تم الدخول. جارٍ فتح حسابك…");

        const destination = await resolveDestination(
          data.user.id,
          typeof data.user.user_metadata?.role === "string"
            ? data.user.user_metadata.role
            : undefined,
        );

        router.replace(
          destination === "/onboarding"
            ? destination
            : safeNextPath(nextPath) ||
                (typeof window !== "undefined"
                  ? safeNextPath(
                      new URLSearchParams(window.location.search).get("next"),
                    )
                  : "") ||
                destination,
        );
        router.refresh();
        return;
      }

      setPhase("جارٍ إنشاء الحساب…");

      const cleanName = fullName.trim();
      const cleanCountry = country.trim();

      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
              role,
              country: cleanCountry,
            },
          },
        });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("تعذر إنشاء المستخدم.");
      }

      if (!data.session) {
        setPhase("");
        setSuccess(
          "تم إنشاء الحساب. إذا كان تأكيد البريد مفعّلًا، افتح رسالة التفعيل ثم سجّل الدخول.",
        );
        return;
      }

      setPhase("جارٍ تجهيز ملفك الشخصي…");

      const profilePayload = {
        id: data.user.id,
        email: cleanEmail,
        full_name: cleanName,
        role,
        country: cleanCountry,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profilePayload, {
          onConflict: "id",
        });

      if (profileError) {
        console.warn(
          "DADYOOM_PROFILE_UPSERT_WARNING",
          profileError,
        );

        try {
          await fetch("/api/auth/complete-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fullName: cleanName,
              role,
              country: cleanCountry,
            }),
          });
        } catch (profileRouteError) {
          console.warn(
            "DADYOOM_COMPLETE_PROFILE_WARNING",
            profileRouteError,
          );
        }
      }

      setPhase("تم إنشاء الحساب. جارٍ فتح ضاديوم…");

      router.replace(
        roleDestinations[role] || "/student",
      );
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "تعذر إكمال العملية.";

      setPhase("");
      setError(authMessage(message));
    } finally {
      setLoading(false);
    }
  }

  const signup = mode === "signup";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6"
    >
      <section className="mx-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#e3d4b6] bg-white shadow-xl shadow-[#123f39]/10">
        <header className="bg-gradient-to-l from-[#123f39] to-[#1f665c] px-6 py-7 text-white">
          <p className="text-sm font-black text-[#f5cf7a]">
            ضاديوم · بيت العربية الرقمي
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {signup ? "إنشاء حساب" : "تسجيل الدخول"}
          </h1>
        </header>

        <div className="space-y-5 p-6">
          <form
            onSubmit={submit}
            className="space-y-4"
          >
            {signup ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#123f39]">
                    الاسم الكامل
                  </span>
                  <input
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    autoComplete="name"
                    className="w-full rounded-xl border border-[#d8c7a6] px-4 py-3 text-base outline-none focus:border-[#123f39]"
                    placeholder="الاسم الكامل"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#123f39]">
                    نوع الحساب
                  </span>
                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d8c7a6] px-4 py-3 text-base outline-none focus:border-[#123f39]"
                  >
                    <option value="child">طفل</option>
                    <option value="student">طالب</option>
                    <option value="teacher">معلم</option>
                    <option value="parent">ولي أمر</option>
                    <option value="school">مدرسة</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#123f39]">
                    الدولة
                  </span>
                  <select
                    value={country}
                    onChange={(event) =>
                      setCountry(event.target.value)
                    }
                    className="w-full rounded-xl border border-[#d8c7a6] bg-white px-4 py-3 text-base outline-none focus:border-[#123f39]"
                  >
                    {countries.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#123f39]">
                البريد الإلكتروني
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                inputMode="email"
                required
                className="w-full rounded-xl border border-[#d8c7a6] px-4 py-3 text-base outline-none focus:border-[#123f39]"
                placeholder="name@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#123f39]">
                كلمة المرور
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete={
                  signup
                    ? "new-password"
                    : "current-password"
                }
                required
                minLength={8}
                className="w-full rounded-xl border border-[#d8c7a6] px-4 py-3 text-base outline-none focus:border-[#123f39]"
                placeholder="8 أحرف على الأقل"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="touch-manipulation w-full rounded-xl bg-[#123f39] px-5 py-3.5 font-black text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? "جارٍ التنفيذ…"
                : signup
                  ? "إنشاء الحساب بالبريد"
                  : "الدخول بالبريد"}
            </button>
          </form>

          {phase ? (
            <p className="rounded-xl bg-[#eef8f4] p-3 text-center text-sm font-bold text-[#123f39]">
              {phase}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-bold leading-6 text-emerald-800">
              {success}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-rose-50 p-3 text-center text-sm font-bold leading-6 text-rose-800">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#eadfc9]" />
            <span className="text-xs font-black text-[#8a7654]">
              أو
            </span>
            <span className="h-px flex-1 bg-[#eadfc9]" />
          </div>

          <GoogleAuthButton
            mode={mode}
            fullName={fullName}
            role={role}
            country={country}
            nextPath={nextPath}
          />

          <p className="text-center text-sm font-bold text-[#685b47]">
            {signup ? "لديك حساب بالفعل؟ " : "ليس لديك حساب؟ "}
            <Link
              href={signup ? "/login" : "/signup"}
              className="font-black text-[#123f39] underline"
            >
              {signup ? "تسجيل الدخول" : "إنشاء حساب"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

