import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import { LEARNING_STORIES } from "@/lib/story-lab/stories";

export const metadata: Metadata = {
  title: "حكايات ضاديوم | العربية أسهل بالقصة والتجربة",
  description: "ثلاث حكايات عربية تفاعلية أصلية في الإملاء والنحو، مع أسئلة وتلميحات فورية دون حساب أو دفع.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/labs/stories" },
};

export default function StoryLabIndexPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#27231f]">
      <header className="border-b border-[#e5d8bf] bg-[#fffef9]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <DadyoomLogo />
          <nav aria-label="التنقل" className="flex flex-wrap items-center gap-4 text-sm font-bold text-[#174f47]">
            <Link href="/" className="hover:underline">الرئيسية</Link>
            <Link href="/labs/letters" className="hover:underline">مختبر الحروف</Link>
            <Link href="/courses" className="hover:underline">دروس المنهج</Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <section className="rounded-[2rem] border border-[#dbc89e] bg-gradient-to-bl from-[#174f47] to-[#123f39] p-8 text-white sm:p-12">
          <p className="text-sm font-black text-[#e5c889]">حكايات ضاديوم • بيت اللغة العربية</p>
          <h1 className="mt-4 font-arabic-display text-3xl font-black leading-snug sm:text-5xl">العربية أسهل حين نفهمها ونعيشها</h1>
          <p className="mt-5 max-w-3xl text-lg leading-9 text-[#f7f0e0]">
            لا نبدأ بحفظ قاعدة مجردة؛ نبدأ بسؤال، ونجرب مع الشخصيات، ثم نجيب بأنفسنا.
            هذه تجارب إثرائية قصيرة مستقلة عن الدروس الوزارية والدرجات الرسمية.
          </p>
        </section>
        <section className="mt-9">
          <h2 className="text-2xl font-black text-[#174f47]">اختر حكايتك التعليمية</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {LEARNING_STORIES.map((story, index) => (
              <article key={story.slug} className="flex flex-col rounded-[1.6rem] border border-[#ddcfb3] bg-[#fffef9] p-6 shadow-sm">
                <span aria-hidden="true" className="text-5xl">{["✨", "🌷", "☀️"][index]}</span>
                <p className="mt-4 text-sm font-black text-[#a17128]">{story.badge} • {story.questions.length} أسئلة تطبيقية</p>
                <h3 className="mt-2 text-2xl font-black leading-snug text-[#174f47]">{story.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-[#6b6155]">{story.goal}</p>
                <Link href={"/labs/stories/" + story.slug} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#174f47] px-5 py-3 font-black text-white hover:bg-[#123f39] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#d6ad57]">
                  ابدأ الحكاية ←
                </Link>
              </article>
            ))}
          </div>
        </section>
        <p className="mt-8 text-center text-sm leading-8 text-[#746b60]">
          يراعي النشاط الاتجاه العربي والشاشات الصغيرة، ويتيح الاستماع إذا دعمه المتصفح، مع بديل مكتوب دائمًا.
          النتائج للتدريب داخل الجلسة ولا تُحفظ.
        </p>
      </div>
    </main>
  );
}
