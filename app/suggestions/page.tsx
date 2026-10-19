import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/contact/ContactForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "صندوق المقترحات | ضاديوم",
  description: "شارك أفكارك واقتراحاتك لتحسين منصة ضاديوم للطلاب والمعلمين وأولياء الأمور والمدارس.",
  alternates: { canonical: "/suggestions" },
};

export default function SuggestionsPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-10 text-[#203a34]">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
          <Link href="/">الرئيسية</Link><span>←</span>
          <Link href="/contact">تواصل معنا</Link><span>←</span>
          <span>صندوق المقترحات</span>
        </nav>
        <header className="rounded-[2rem] bg-[#123f39] px-6 py-8 text-white sm:p-10">
          <p className="text-sm font-black text-[#f5d38b]">ضاديوم • ننافس أنفسنا قبل الجميع</p>
          <h1 className="mt-2 font-arabic-display text-3xl font-black sm:text-5xl">ضاديوم معك — صندوق المقترحات</h1>
          <p className="mt-3 text-lg font-bold text-[#f4d48b]">صوتك يُسمَع، ورأيك يصنع الفرق</p>
          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#e4eee9]">
            شاركنا فكرة تجعل الدروس أو تجربة الطالب والمعلم وولي الأمر والمدرسة أفضل.
            كل اقتراح يُسجل في صندوق الإدارة لمراجعته؛ لا يعني إرساله اعتمادًا تلقائيًا.
          </p>
        </header>
        <ContactForm initialCategory="suggestion" />
        <p className="text-sm leading-7 text-[#665d50]">
          يمكن الإبلاغ عن مشكلة من <Link href="/contact" className="font-bold underline">صفحة التواصل والدعم</Link>.
          لا ترفق كلمات مرور أو بيانات طلاب شخصية غير ضرورية.
        </p>
      </div>
    </main>
  );
}
