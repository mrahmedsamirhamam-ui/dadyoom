import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "مكتبة ضاديوم العالمية | رحلة القارئ العربي",
  description: "مكتبة ضاديوم للقراءة والتلخيص والتدرب على الفهم والمناقشة.",
};

const sections = [
  { title: "اكتشف الكتب", description: "كتب وقصص مصنفة بحسب العمر والموضوع ومستوى القراءة. ستظهر الكتب بعد مراجعة حقوق نشرها.", icon: "📚" },
  { title: "دفتر القراءة", description: "اكتب ملخصك بنفسك، وسجّل ما تعلمته من كل كتاب.", icon: "✍️" },
  { title: "تدرّب على المناقشة", description: "أسئلة للفهم والاستنتاج والتفكير الناقد استعدادًا للمقابلات القرائية.", icon: "🎙️" },
];

const stages = [
  { name: "الأحمر", color: "bg-red-600" },
  { name: "الأخضر", color: "bg-green-700" },
  { name: "الأزرق", color: "bg-blue-700" },
  { name: "الفضي", color: "bg-slate-500" },
  { name: "الذهبي", color: "bg-amber-600" },
];

export default function LibraryPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#faf9f6] px-4 py-10 text-[#24382f]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-bold underline underline-offset-4">العودة إلى ضاديوم</Link>
        <header className="mt-8 rounded-3xl bg-[#174f47] p-7 text-white sm:p-12">
          <p className="text-sm font-semibold text-amber-200">مكتبة ضاديوم العالمية</p>
          <h1 className="mt-3 text-3xl font-black leading-relaxed sm:text-5xl">اقرأ، افهم، لخّص، ناقش، وأبدع</h1>
          <p className="mt-4 max-w-2xl leading-8 text-white/90">رحلتك نحو قراءة واعية: اختر كتابًا مناسبًا، اقرأه، واكتب ملخصك، ثم اختبر فهمك وناقش أفكاره.</p>
          <p className="mt-5 rounded-xl border border-white/30 p-3 text-sm">هذه واجهة تعريفية أولية. فهرس الكتب والحسابات والجوازات التفاعلية لم تُفعّل بعد.</p>
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
        <section aria-labelledby="passports" className="mt-12">
          <h2 id="passports" className="text-2xl font-black">جوازات القراءة التدريبية</h2>
          <p className="mt-2 text-[#52685c]">خمس مراحل، عشرة كتب في كل مرحلة، بمجموع خمسين كتابًا. هذه جوازات تدريب من ضاديوم وليست جوازات رسمية للمسابقة.</p>
          <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {stages.map((stage, index) => (
              <li key={stage.name} className="rounded-2xl border bg-white p-4 text-center">
                <span aria-hidden="true" className={`mx-auto block h-3 w-12 rounded-full ${stage.color}`} />
                <p className="mt-3 font-bold">الجواز {stage.name}</p>
                <p className="mt-1 text-sm text-[#52685c]">الكتب {index * 10 + 1}–{index * 10 + 10}</p>
              </li>
            ))}
          </ol>
        </section>
        <p className="mt-10 border-t pt-5 text-sm text-[#52685c]">يُسمح بعرض النصوص الكاملة فقط بعد إثبات الترخيص أو الملكية العامة. تدريب ضاديوم مستقل وغير تابع للجهة المنظمة لتحدي القراءة العربي.</p>
      </div>
    </main>
  );
}
