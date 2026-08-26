"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      aria-label="تسجيل الخروج"
      title="تسجيل الخروج"
      className="rounded-full border border-[#d8c9aa] bg-[#fffaf0] px-3 py-2.5 text-xs font-black text-[#765f3d] transition hover:border-[#b98a35] hover:bg-[#fff4dc] hover:text-[#123f39] disabled:opacity-60"
    >
      {loading ? "…" : compact ? "خروج" : "تسجيل الخروج"}
    </button>
  );
}
