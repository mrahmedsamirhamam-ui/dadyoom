"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

/**
 * Exiting a page is navigation; only this explicit button ends the session.
 * Never navigate to /login if Supabase rejected sign-out.
 */
export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login");
      router.refresh();
    } catch {
      // If the session is still active, do not pretend the user logged out.
      setError("تعذر تسجيل الخروج. لم نؤكد إنهاء الجلسة؛ حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1" dir="rtl">
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        aria-label="تسجيل الخروج من الحساب"
        title="تسجيل الخروج من الحساب"
        className={"min-h-11 rounded-full border border-[#d8c9aa] bg-[#fffaf0] px-3 py-2.5 text-xs font-black text-[#765f3d] transition hover:border-[#b98a35] hover:bg-[#fff4dc] hover:text-[#123f39] disabled:opacity-60 " +
          (compact ? "whitespace-nowrap" : "")}
      >
        {loading ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
      </button>
      {error && <p role="alert" className="max-w-64 rounded-lg bg-rose-50 p-2 text-xs leading-6 text-rose-800">{error}</p>}
    </div>
  );
}
