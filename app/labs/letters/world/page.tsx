import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LetterWorldClient from "@/components/labs/letters/LetterWorldClient";
import "./world.css";

export const metadata: Metadata = {
  title: "عالم الحروف الحية | ضاديوم",
  description: "تجربة تعليمية مجانية للحروف العربية الثمانية والعشرين مع مجسمات ذات عمق ثلاثي الأبعاد وتحديات تفاعلية ونطق اختياري.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/labs/letters/world" },
};

export default function LetterWorldPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f2f8f1] text-[#174f47]">
      <header className="border-b border-[#d7e6d9] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav className="flex gap-5 text-sm font-bold" aria-label="التنقل">
            <Link className="hover:underline" href="/labs/letters">مختبر الحروف</Link>
            <Link className="hover:underline" href="/">الرئيسية</Link>
          </nav>
        </div>
      </header>
      <LetterWorldClient />
    </main>
  );
}
