import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LetterLabClient from "@/components/labs/letters/LetterLabClient";

export const metadata: Metadata = {
  title: "مختبر الحروف التفاعلي | ضاديوم",
  description: "نشاط عربي مجاني: من الحرف إلى الكلمة والمعنى، بثلاثة مستويات وتغذية راجعة فورية.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/labs/letters" },
};

export default function LettersLabPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#27231f]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="التنقل" className="flex items-center gap-4 text-sm font-bold text-[#174f47]">
            <Link className="hover:underline" href="/">الرئيسية</Link>
            <Link className="hover:underline" href="/labs/stories">حكايات ضاديوم</Link>
            <Link className="hover:underline" href="/courses">دروس المنهج</Link>
          </nav>
        </div>
      </header>
      <LetterLabClient />
    </main>
  );
}
