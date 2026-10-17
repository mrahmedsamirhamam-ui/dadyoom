import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GamePackReviewClient from "./GamePackReviewClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "مراجعة ألعاب ضاديوم — الإدارة", robots: { index: false, follow: false } };

export default async function GamePackReviewPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  const profile = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile.error || profile.data?.role !== "admin") redirect("/");
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] p-5 text-[#123f39]">
    <section className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-3xl bg-[#123f39] p-6 text-white">
        <h1 className="text-2xl font-black">مراجعة واعتماد ألعاب الدروس</h1>
        <p className="mt-3 leading-8">ذكاء ضاديوم يستطيع اقتراح أسئلة بتنسيق JSON، لكن النشر للتلاميذ يحتاج مراجعة كل سؤال وإجابته من مسؤول مخوّل.</p>
      </header>
      <GamePackReviewClient />
    </section>
  </main>;
}
