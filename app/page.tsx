import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo, { DadyoomMark } from "@/components/brand/DadyoomLogo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const pillars = [
  { icon: "📚", title: "منهج حقيقي منظم", text: "بوابة مبنية للدول العربية: من الدولة والمنهج والصف إلى الوحدة والدرس، مع حزم محتوى موثقة قابلة للإضافة دون إعادة برمجة." },
  { icon: "ض", title: "ضاد رفيق العربية", text: "شرح وتلميحات وتدريب يفهم لهجتك ويعلّمك بفصحى سهلة دون أن يستبدل المعلم." },
  { icon: "✦", title: "رحلة تناسب المتعلم", text: "تقدم وتقييم وتوصيات ومكافآت تجعل الخطوة التالية واضحة بدل التنقل العشوائي." },
  { icon: "👥", title: "منظومة تعليم كاملة", text: "تجارب مترابطة للطالب والمعلم وولي الأمر والمدرسة مع صلاحيات واضحة لكل دور." },
];

const skills = [
  { icon: "📖", title: "القراءة", text: "فهم النص والسياق" },
  { icon: "✍️", title: "الكتابة", text: "الإملاء والتعبير" },
  { icon: "🎧", title: "الاستماع", text: "فهم المسموع" },
  { icon: "🎙️", title: "التحدث", text: "النطق والتعبير" },
];

export default function HomePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#27231f]">
      <header className="sticky top-0 z-50 border-b border-[#e5d8bf]/90 bg-[#fffef9]/94 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <DadyoomLogo />
          <nav className="hidden items-center gap-6 text-sm font-black text-[#655c51] md:flex">
            <a href="#mvp" className="transition hover:text-[#174f47]">المنهج</a>
            <a href="#skills" className="transition hover:text-[#174f47]">المهارات</a>
            <Link href="/courses" className="transition hover:text-[#174f47]">استكشف الدروس</Link>
            <Link href="/ask" className="transition hover:text-[#174f47]">اسأل ضاد</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-black text-[#5d554c] hover:bg-[#f3ead7] sm:inline-flex">دخول</Link>
            <Link href="/signup" className="rounded-xl bg-[#174f47] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#103f39]">ابدأ مجانًا</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#eadfc9]">
        <div aria-hidden="true" className="absolute inset-0 opacity-70" style={{ backgroundImage: "radial-gradient(circle at 16% 20%, rgba(214,181,105,.18) 0 2px, transparent 2.5px), radial-gradient(circle at 86% 18%, rgba(23,79,71,.09) 0 1.5px, transparent 2px)", backgroundSize: "44px 44px, 32px 32px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c18a] bg-[#fffef9] px-4 py-2 text-sm font-black text-[#72551c] shadow-sm">
              <span>✦</span><span>العربية تجمعنا، ولا تُذيب أحدًا</span>
            </div>
            <h1 className="mt-7 max-w-3xl font-arabic-display text-4xl font-black leading-[1.45] text-[#213b36] sm:text-5xl lg:text-[3.65rem]">
              بيت عربي رقمي يجعل
              <span className="block text-[#a8782f]">التعلّم رحلة مفهومة ومحبوبة</span>
            </h1>
            <p className="mt-6 max-w-2xl font-arabic-reading text-xl leading-10 text-[#655d53]">
              منهج منظم، مهارات أربع، تقييم وتقدم، و«ضاد» رفيق ذكي يساعد الطالب في اللحظة التي يحتاج فيها إلى شرح أو تدريب.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="rounded-2xl bg-[#174f47] px-7 py-4 font-black text-white shadow-lg shadow-[#174f47]/15 transition hover:-translate-y-0.5 hover:bg-[#103f39]">أنشئ حسابك</Link>
              <Link href="/ask" className="rounded-2xl border border-[#d6b569] bg-[#fffef9] px-7 py-4 font-black text-[#72551c] transition hover:-translate-y-0.5 hover:bg-[#fff6df]">جرّب ضاد الآن</Link>
              <Link href="/courses" className="rounded-2xl border border-[#d9cdb7] bg-white px-7 py-4 font-black text-[#4d4438] transition hover:border-[#84a89f] hover:text-[#174f47]">تصفّح المنهج</Link>
            </div>
            <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat value="22" label="دولة عربية في البنية" />
              <MiniStat value="1" label="حزمة منهج منشورة" />
              <MiniStat value="4" label="مهارات" />
              <MiniStat value="24/7" label="ضاد" />
            </div>
          </div>

          <div className="relative">
            <div className="mx-auto max-w-lg rounded-[2.5rem] border border-[#dccba8] bg-[#fffef9] p-5 shadow-2xl shadow-[#174f47]/10">
              <div className="rounded-[2rem] bg-[#174f47] p-7 text-white">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-bold text-[#dbeae5]">رفيقك في العربية</p>
                    <h2 className="mt-2 font-arabic-display text-3xl font-black">مرحبًا، أنا ضاد</h2>
                    <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#edf6f2]">اسألني عن كلمة أو قاعدة أو درس. سأبدأ بما تحتاجه مباشرة وأعطيك تلميحًا عندما يكون التعلّم أفضل من إعطاء الحل.</p>
                  </div>
                  <DadyoomMark inverse className="h-20 w-20 rounded-[1.6rem]" />
                </div>
                <div className="mt-7 rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="text-xs font-bold text-[#f7e6bc]">سؤال سريع</div>
                  <div className="mt-2 font-black">كيف أفرّق بين التاء المربوطة والهاء؟</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-2 pt-5">
                <InfoCard icon="📗" title="منهجك" text="من الدولة إلى الدرس" />
                <InfoCard icon="🎯" title="تدريب" text="طبّق فورًا" />
                <InfoCard icon="📈" title="تقدم" text="اعرف خطوتك التالية" />
                <InfoCard icon="🏅" title="تحفيز" text="XP وشارات وتحديات" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="mvp" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="بوابة مناهج عربية" title="المنهج الأساسي جاهز، والمعلم يثريه بدل أن يبدأ من الصفر" text="البحرين هي أول حزمة منشورة، وليست حدود ضاديوم. بنية المنصة مصممة لتستقبل حزم الدول والصفوف والفصول الدراسية مع الحفاظ على مصدر وإصدار كل منهج." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pillars.map((item) => (
              <article key={item.title} className="arabic-panel rounded-3xl border border-[#e2d4b8] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#c8ab68] hover:shadow-lg">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf5f1] text-2xl font-black text-[#174f47]">{item.icon}</div>
                <h3 className="mt-5 font-arabic-display text-lg font-black text-[#273e39]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6c6358]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="border-y border-[#eadfc9] bg-[#f7f0e3] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="المهارات الأربع" title="نتعلم العربية كما نستخدمها" text="القراءة والكتابة والاستماع والتحدث متصلة بالتقدم والتدريب، وليست صفحات منفصلة للعرض فقط." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill) => (
              <Link key={skill.title} href="/skills" className="rounded-3xl border border-[#dfd0b3] bg-[#fffef9] p-6 transition hover:-translate-y-1 hover:border-[#7fa79d] hover:shadow-md">
                <div className="text-4xl">{skill.icon}</div>
                <h3 className="mt-4 font-arabic-display text-xl font-black text-[#174f47]">{skill.title}</h3>
                <p className="mt-2 text-sm font-bold text-[#766c60]">{skill.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-[#174f47] p-8 text-white shadow-xl sm:p-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-black text-[#f5cf7a]">أول إنجاز يبدأ في دقائق</div>
              <h2 className="mt-3 font-arabic-display text-3xl font-black sm:text-4xl">اختر دولتك ودورك، وابدأ من مكان واضح</h2>
              <p className="mt-3 max-w-2xl font-arabic-reading text-lg leading-8 text-[#e7f0ec]">يمكنك التسجيل بالبريد أو Google. وعندما لا يتوفر منهج دولتك بعد، تبقى المهارات الأربع وقاموس السياق وضاد متاحة لك.</p>
            </div>
            <Link href="/signup" className="inline-flex shrink-0 justify-center rounded-2xl bg-[#f5cf7a] px-7 py-4 font-black text-[#493814] transition hover:-translate-y-0.5 hover:bg-[#ffe39e]">ابدأ رحلتك</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#315e57] bg-[#123f39] py-10 text-[#d9e8e3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <DadyoomLogo inverse />
          <div className="text-sm">العربية تجمعنا، ولا تُذيب أحدًا.</div>
          <div className="text-sm">© 2026 ضاديوم</div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="text-sm font-black text-[#a8782f]">{eyebrow}</div>
      <h2 className="mt-3 font-arabic-display text-3xl font-black text-[#213b36] sm:text-4xl">{title}</h2>
      <p className="mt-4 font-arabic-reading text-lg leading-9 text-[#6a6258]">{text}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#dfd2b9] bg-[#fffef9] p-4 text-center shadow-sm">
      <div className="text-xl font-black text-[#174f47]">{value}</div>
      <div className="mt-1 text-xs font-bold text-[#746b60]">{label}</div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#e5d8bf] bg-[#faf5eb] p-4">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-black text-[#2e3f3a]">{title}</div>
      <div className="mt-1 text-xs font-semibold text-[#746b60]">{text}</div>
    </div>
  );
}
