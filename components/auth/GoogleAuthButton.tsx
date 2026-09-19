"use client";

import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  mode: "login" | "signup";
  fullName?: string;
  role?: string;
  country?: string;
  nextPath?: string;
};

const NATIVE_CALLBACK = "dadyoom://auth/callback";
const NATIVE_INTENT_KEY = "dadyoom_native_oauth_intent";

function timeout(ms: number) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(
      () => reject(new Error("GOOGLE_BROWSER_OPEN_TIMEOUT")),
      ms,
    );
  });
}

export default function GoogleAuthButton({
  mode,
  fullName = "",
  role = "student",
  country = "",
  nextPath = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [providerEnabled, setProviderEnabled] =
    useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/provider-status", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data: { google?: boolean }) => {
        if (!cancelled) {
          setProviderEnabled(data.google === true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProviderEnabled(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function continueWithGoogle() {
    if (loading) return;

    setLoading(true);
    setError("");
    setManualUrl("");
    setPhase("تم الضغط على Google…");

    try {
      if (providerEnabled === false) {
        throw new Error(
          "Google غير مفعّل في إعدادات تسجيل الدخول.",
        );
      }

      const isNative = Capacitor.isNativePlatform();

      if (mode === "signup") {
        setPhase("جارٍ تجهيز بيانات الحساب…");

        const intent = {
          fullName: fullName.trim(),
          role: role.trim(),
          country: country.trim(),
        };

        const intentResponse = await fetch(
          "/api/auth/oauth-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(intent),
          },
        );

        const intentData =
          (await intentResponse.json()) as {
            error?: string;
          };

        if (!intentResponse.ok) {
          throw new Error(
            intentData.error ||
              "أكمل الاسم ونوع الحساب والدولة أولًا.",
          );
        }

        if (isNative) {
          window.localStorage.setItem(
            NATIVE_INTENT_KEY,
            JSON.stringify(intent),
          );
        }
      }

      setPhase("جارٍ إنشاء رابط Google…");

      const supabase = getSupabaseBrowserClient();

      const { data, error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: isNative
              ? NATIVE_CALLBACK
              : `${window.location.origin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`,
            skipBrowserRedirect: isNative,
            queryParams: {
              prompt: "select_account",
            },
          },
        });

      if (oauthError) {
        throw oauthError;
      }

      if (!isNative) {
        setPhase("جارٍ التحويل إلى Google…");
        return;
      }

      if (!data.url) {
        throw new Error(
          "لم يصل رابط Google من Supabase.",
        );
      }

      setManualUrl(data.url);
      setPhase("جارٍ فتح Google خارج التطبيق…");

      try {
        await Promise.race([
          Browser.open({
            url: data.url,
          }),
          timeout(7000),
        ]);

        setPhase(
          "تم إرسال الطلب إلى Google. إذا لم تظهر نافذة الحسابات استخدم زر «فتح Google الآن» أدناه.",
        );
      } catch (browserError) {
        console.error(
          "DADYOOM_GOOGLE_BROWSER_OPEN_ERROR",
          browserError,
        );

        setPhase(
          "تعذر فتح Google تلقائيًا. استخدم زر «فتح Google الآن» أدناه.",
        );
      }
    } catch (cause) {
      console.error("DADYOOM_GOOGLE_OAUTH_ERROR", cause);

      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر بدء تسجيل الدخول بجوجل.",
      );
      setPhase("");
    } finally {
      setLoading(false);
    }
  }

  async function openManualGoogle() {
    if (!manualUrl) return;

    setError("");
    setPhase("جارٍ فتح Google…");

    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: manualUrl,
        });
      } else {
        window.location.assign(manualUrl);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر فتح Google.",
      );
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={loading}
        aria-busy={loading}
        className="touch-manipulation flex w-full items-center justify-center gap-3 rounded-xl border border-[#d8cbb3] bg-white px-5 py-3.5 font-black text-[#3f3932] shadow-sm transition active:scale-[0.98] active:bg-[#fff4dc] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white font-black text-[#4285F4] shadow-sm"
        >
          G
        </span>

        {loading
          ? "جارٍ تجهيز Google…"
          : mode === "signup"
            ? "إنشاء الحساب باستخدام Google"
            : "الدخول باستخدام Google"}
      </button>

      {phase ? (
        <p className="rounded-xl bg-[#eef8f4] p-3 text-center text-xs font-bold leading-6 text-[#123f39]">
          {phase}
        </p>
      ) : null}

      {manualUrl ? (
        <button
          type="button"
          onClick={openManualGoogle}
          className="touch-manipulation w-full rounded-xl bg-[#123f39] px-5 py-3 font-black text-white transition active:scale-[0.98]"
        >
          فتح Google الآن
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-rose-50 p-3 text-center text-xs font-bold leading-6 text-rose-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
