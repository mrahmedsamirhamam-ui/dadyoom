import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import FreeLevelCheck from "@/components/level-check/FreeLevelCheck";

export const metadata: Metadata = {
  title: "اكتشف نقطة البداية في العربية | ضاديوم",
  description: "نشاط مجاني استرشادي قصير لفهم المقروء والمفردات والتراكيب النحوية والإملاء، مع اقتراح تدريبات مناسبة في ضاديوم.",
  alternates: { canonical: "/level-check" },
  robots: { index: true, follow: true },
};

export default function LevelCheckPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#27231f]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="التنقل" className="flex flex-wrap items-center gap-4 text-sm font-bold text-[#174f47]">
            <Link href="/" className="hover:underline">الرئيسية</Link>
            <Link href="/labs/letters" className="hover:underline">مختبر الحروف</Link>
            <Link href="/courses" className="hover:underline">المناهج</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-7 px-4 py-9 sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-l from-[#123f39] to-[#197568] p-6 text-white sm:p-10">
          <p className="text-sm font-black text-[#f5cf7a]">نشاط استرشادي مجاني من ضاديوم</p>
          <h1 className="mt-3 font-arabic-display text-3xl font-black leading-snug sm:text-5xl">
            اكتشف من أين تبدأ رحلتك في العربية
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-9 text-[#edf6f1]">
            12 سؤالًا أصليًا في فهم المقروء والمفردات والتراكيب والإملاء.
            بعد الإجابة تظهر نقاط القوة ومجال يحتاج إلى مزيد من التدريب، مع روابط لأدوات ضاديوم.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-white/15 px-4 py-2">دون تسجيل دخول</span>
            <span className="rounded-full bg-white/15 px-4 py-2">نتيجة فورية</span>
            <span className="rounded-full bg-white/15 px-4 py-2">لا تُجمع بيانات الطفل</span>
          </div>
        </section>
        <aside className="rounded-2xl border border-[#dfcfad] bg-[#fff7e4] p-5 leading-8 text-[#72572c]">
          <strong>تنبيه تربوي:</strong> النشاط مناسب مبدئيًا لمن يستطيع قراءة الجمل البسيطة، ولا يحدد
          الصف الدراسي أو مستوى إتقان اللغة رسميًا. للأطفال الذين يبدأون بالحروف،
          {" "}
          <Link href="/labs/letters" className="font-black underline underline-offset-4">
            ابدأ بمختبر الحروف
          </Link>.
          لا يتم حفظ الدرجة، ولا تُحتسب ضمن إنجازات الطالب.
        </aside>
        <FreeLevelCheck />
      </div>
    </main>
  );
}
