import type { Metadata } from "next";
import Link from "next/link";
import HalAdaptiveLesson from "@/components/lesson/HalAdaptiveLesson";
export const metadata: Metadata = {
  title:"نموذج مسارات الحال | مختبر ضاديوم",
  description:"نموذج تربوي لمراجعة ثلاثة مسارات نحو هدف تعليمي واحد، دون اعتماد وزاري.",
  robots:{ index:false, follow:false },
};
export default function AdaptiveHalPage() {
  return <main dir="rtl" className="min-h-screen bg-[#fffaf0] pb-[calc(12rem+env(safe-area-inset-bottom,0px))] text-[#24382f]">
    <header className="border-b border-[#e5d8bf] bg-[#fffef9] px-4 py-4">
      <div className="mx-auto flex max-w-3xl justify-between gap-4">
        <strong className="text-[#174d44]">ضاديوم · بيت العربية الرقمي</strong>
        <Link href="/" className="text-sm font-bold text-[#174d44] underline">الرئيسية</Link>
      </div>
    </header>
    <HalAdaptiveLesson />
  </main>;
}
