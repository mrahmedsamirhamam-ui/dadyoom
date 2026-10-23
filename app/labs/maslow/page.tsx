import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import MaslowLabClient from "@/components/labs/maslow/MaslowLabClient";

export const metadata: Metadata = {
  title: "هرم ماسلو التفاعلي — الاحتياجات والتعلّم | ضاديوم",
  description: "تعرّف إلى خمسة مجالات للاحتياجات الإنسانية من خلال أمثلة مدرسية وأنشطة لغة عربية وتعلّم نشط في ضاديوم.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/labs/maslow" },
};

export default function MaslowLabPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#2b2823]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="التنقل" className="flex items-center gap-4 text-sm font-bold text-[#174f47]">
            <Link className="hover:underline focus-visible:underline" href="/">الرئيسية</Link>
            <Link className="hover:underline focus-visible:underline" href="/skills">مهارات العربية</Link>
          </nav>
        </div>
      </header>
      <MaslowLabClient />
    </main>
  );
}
