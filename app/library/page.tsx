import type { Metadata } from "next";
import Link from "next/link";
import LocalReadingPanel from "@/components/library/LocalReadingPanel";

export const metadata: Metadata = {
  title: "مكتبة ضاديوم التعليمية التفاعلية | رحلة القارئ العربي",
  description: "مكتبة ضاديوم للتدرب على القراءة والتلخيص ومتابعة الجوازات التدريبية محليًا.",
};
const sections = [
  { title: "اكتشف الكتب", description: "اطلع على مؤلفات صاحب المشروع وحالة حقوق كل كتاب.", icon: "📚" },
  { title: "دفتر القراءة", description: "اكتب ملاحظاتك بنفسك واحفظها على جهازك دون حساب.", icon: "✍️" },
  { title: "فهم المقروء", description: "تُضاف أسئلة قصيرة بعد مراجعتها بشريًا وتوثيق حقوق الكتب؛ لا تقييم آلي الآن.", icon: "📝" },
];
export default function LibraryPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#faf9f6] px-4 py-10 text-[#24382f]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold underline underline-offset-4">العودة إلى ضاديوم</Link>
        <header className="mt-8 rounded-3xl bg-[#174f47] p-7 text-white sm:p-12">
          <p className="text-sm font-semibold text-amber-200">مكتبة ضاديوم التعليمية التفاعلية — نسخة مصغّرة</p>
          <h1 className="mt-3 text-3xl font-black leading-relaxed sm:text-5xl">اقرأ، افهم، لخّص، وأبدع</h1>
          <p className="mt-4 max-w-2xl leading-8 text-white/90">رحلة قراءة تدريبية: اكتشف الكتب، وسجّل ملاحظاتك محليًا، وتابع مراحل الجوازات الخمسة.</p>
          <p className="mt-5 rounded-xl border border-white/30 p-3 text-sm">نسخة تجريبية معزولة: لا اعتماد كتب أو شهادات أو مزامنة أو تقييم آلي. حقوق إتاحة الكتب قيد التحقق.</p>
        </header>
        <section aria-labelledby="journey" className="mt-10">
          <h2 id="journey" className="text-2xl font-black">رحلة القارئ</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {sections.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[#e5dfd2] bg-white p-6">
                <span aria-hidden="true" className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 leading-7 text-[#52685c]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>
        <section aria-labelledby="curriculum-reading" className="mt-10 rounded-2xl border border-[#e5dfd2] bg-white p-6">
          <h2 id="curriculum-reading" className="text-2xl font-black">القراءة المرتبطة بالمناهج</h2>
          <p className="mt-3 leading-8 text-[#52685c]">
            نجهّز ربطًا بين الدروس والقراءات الإثرائية المناسبة للدولة والصف. لم تُعتمد روابط دروس في هذه النسخة بعد؛
            ولن يظهر أي كتاب على أنه مطابق لمنهج رسمي دون مراجعة موثقة.
          </p>
          <p className="mt-3 text-sm font-semibold text-amber-800">الحالة الحالية: روابط إثرائية موثقة — 0</p>
        </section>
        <LocalReadingPanel />
        <p className="mt-10 border-t pt-5 text-sm text-[#52685c]">النصوص الكاملة لا تُعرض دون توثيق حقوق إتاحتها. الجوازات تدريبية مستقلة وغير رسمية.</p>
      </div>
    </main>
  );
}
