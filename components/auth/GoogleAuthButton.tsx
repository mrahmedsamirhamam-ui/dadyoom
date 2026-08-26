
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  mode: "login" | "signup";
  fullName?: string;
  role?: string;
  country?: string;
};

export default function GoogleAuthButton({
  mode,
  fullName = "",
  role = "student",
  country = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [providerEnabled, setProviderEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/provider-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { google?: boolean }) => {
        if (!cancelled) setProviderEnabled(data.google === true);
      })
      .catch(() => {
        if (!cancelled) setProviderEnabled(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function continueWithGoogle() {
    if (loading) return;

    if (providerEnabled === false) {
      setError("تسجيل Google لم يُفعّل بعد في إعدادات Supabase. الكود جاهز، لكن مزود Google يحتاج Client ID وClient Secret من حساب Google Cloud.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        const intentResponse = await fetch("/api/auth/oauth-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, role, country }),
        });
        const intentData = (await intentResponse.json()) as { error?: string };
        if (!intentResponse.ok) throw new Error(intentData.error || "أكمل بيانات الحساب أولًا.");
      }

      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) throw oauthError;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر بدء تسجيل الدخول بجوجل.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#d8cbb3] bg-white px-5 py-3.5 font-black text-[#3f3932] shadow-sm transition hover:border-[#b99b58] hover:bg-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white font-black text-[#4285F4] shadow-sm">G</span>
        {loading
          ? "جارٍ التحويل إلى Google..."
          : mode === "signup"
            ? "إنشاء الحساب باستخدام Google"
            : "الدخول باستخدام Google"}
      </button>

      {providerEnabled === false ? (
        <p className="text-center text-xs font-bold text-amber-700">Google يحتاج تفعيل المزود مرة واحدة قبل الاستخدام.</p>
      ) : null}

      {error ? <p className="rounded-xl bg-amber-50 p-3 text-center text-xs font-bold leading-6 text-amber-800">{error}</p> : null}
    </div>
  );
}
