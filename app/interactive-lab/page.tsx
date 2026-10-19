import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import { PYRAMID_PACKS } from "@/lib/learning-pyramid/packs";

export const metadata: Metadata = {
  title: "مختبر ضاديوم التفاعلي — تعلّم العربية بالاستكشاف",
  description: "تجارب لغوية تفاعلية أصلية في مختبر ضاديوم، تبدأ بهرم الإتقان ذي المستويات الستة.",
  alternates: { canonical: "/interactive-lab" },
};

export default function InteractiveLabPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#28463c]">
      <header className="border-b border-[#e6d8c2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <Link href="/" className="rounded-xl border border-[#d6c6a8] px-4 py-2 text-sm font-black text-[#174f47]">العودة للرئيسية</Link>
        </div>
      </header>
      <section className="bg-[#123f39] px-5 py-14 text-center text-white">
        <p className="text-sm font-bold text-[#f8d88d]">من أصالة العربية وروح الابتكار</p>
        <h1 className="mt-3 font-arabic-display text-3xl font-black sm:text-5xl">مختبر ضاديوم التفاعلي</h1>
        <p className="mx-auto mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#e2efe8]">
          لا نكتفي بأن يرى الطالب المفهوم؛ نساعده على اكتشافه وتطبيقه وتحليله وصناعة تعبيره الخاص.
        </p>
      </section>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <section className="grid items-center gap-7 rounded-[2rem] border border-[#e5d7bb] bg-white p-6 shadow-sm md:grid-cols-[1fr_1fr] md:p-8">
          <div>
            <span className="rounded-full bg-[#e9f4ed] px-4 py-2 text-xs font-black text-[#1c644f]">تجربة متاحة الآن داخل المختبر</span>
            <h2 className="mt-5 font-arabic-display text-3xl font-black text-[#174f47]">هرم ضاديوم لإتقان العربية</h2>
            <p className="mt-4 font-arabic-reading leading-9 text-[#706a60]">ستة مستويات متدرجة: اكتشف، افهم، طبّق، حلّل، قوّم، أبدع. أسئلة أصلية وتلميحات وتغذية راجعة، ثم مهمة كتابية يراجعها المتعلم مع معلمه.</p>
            <Link href="/interactive-lab/pyramid" className="mt-5 inline-flex rounded-xl bg-[#174f47] px-6 py-3.5 font-black text-white hover:bg-[#0f4038]">ابدأ رحلة الهرم ←</Link>
          </div>
          <div className="rounded-[1.5rem] border border-[#e6d9bb] bg-[#fbf5e6] px-4 py-6" aria-label="ملخص مستويات الهرم">
            {[...["⭐ أبدع", "⚖️ قوّم", "🧩 حلّل", "✍️ طبّق", "💡 افهم", "🔎 اكتشف"]].map((label, index) => (
              <div key={label} className="mx-auto flex h-12 items-center justify-center rounded-lg border border-white/40 text-sm font-black text-white"
                style={{
                  width: String(40 + index * 12) + "%",
                  backgroundColor: ["#286953", "#9d793d", "#3c7a89", "#38596a", "#8b6461", "#827054"][index],
                }}>
                {label}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[2rem] border border-[#d9c5a0] bg-[#f6ecda] p-6">
          <h2 className="text-xl font-black text-[#174f47]">👩‍🏫 اصنع هرمًا لدرسك</h2>
          <p className="mt-2 font-arabic-reading text-sm leading-8 text-[#645a4f]">للمعلم مساحة تجريبية لتحرير أسئلة المستويات الستة، وتحديد الإجابات والتلميحات، وتجربة النشاط قبل اعتماده. تُصدّر المسودة محليًا دون نشرها تلقائيًا للطلاب.</p>
          <Link href="/interactive-lab/pyramid/teacher" className="mt-3 inline-flex rounded-xl bg-[#174f47] px-5 py-3 text-sm font-black text-white">افتح استوديو هرم المعلم ←</Link>
        </section>
        <section className="rounded-[2rem] border border-[#e1d5bd] bg-white p-6">
          <h2 className="text-xl font-black">الموضوعات المتاحة للتدريب</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PYRAMID_PACKS.map((pack) => (
              <article key={pack.slug} className="rounded-xl border border-[#e5dac8] bg-[#fffef9] p-5">
                <p className="text-xs font-bold text-[#8c6d37]">{pack.stage}</p>
                <h3 className="mt-2 text-lg font-black text-[#174f47]">{pack.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#746a5d]">{pack.goal}</p>
                <Link href="/interactive-lab/pyramid" className="mt-3 inline-block text-sm font-black text-[#18604b] underline">ادخل الهرم</Link>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-[#827762]">الأنشطة تجريبية إثرائية ولا تُقدَّم بوصفها دليلًا على اكتمال مناهج أي دولة أو شهادة لإتقان الدرس.</p>
        </section>
      </div>
    </main>
  );
}
