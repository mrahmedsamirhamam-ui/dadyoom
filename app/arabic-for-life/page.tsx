import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import ArabicLifeExperience from "@/components/arabic-for-life/ArabicLifeExperience";

export const metadata: Metadata = {
  title: "العربية للحياة | تعلم الفصحى المعاصرة بالمحادثة | ضاديوم",
  description: "وحدات تفاعلية أصلية لتعلم العربية الفصحى المعاصرة: التعارف والتسوق والاتجاهات، مع حوارات وأسئلة فهم وتدريبات تحدث وكتابة مجانية.",
  alternates: { canonical: "/arabic-for-life" },
  robots: { index: true, follow: true },
};

export default function ArabicForLifePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#27231f]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="التنقل" className="flex flex-wrap items-center gap-4 text-sm font-bold text-[#174f47]">
            <Link href="/" className="hover:underline">الرئيسية</Link>
            <Link href="/courses" className="hover:underline">المناهج</Link>
            <Link href="/about" className="hover:underline">عن ضاديوم</Link>
          </nav>
        </div>
      </header>
      <ArabicLifeExperience />
    </main>
  );
}
