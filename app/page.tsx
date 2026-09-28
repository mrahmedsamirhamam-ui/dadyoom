import type { Metadata } from "next";
import Link from "next/link";

import DadyoomLogo, {
  DadyoomMark,
} from "@/components/brand/DadyoomLogo";
import HomeInteractionPanel from "@/components/home/HomeInteractionPanel";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const roles = [
  {
    label: "طالب",
    title: "مسار واضح بدل التشتت",
    text: "من الدولة والصف إلى الدرس والتدريب والتقدم في مكان واحد.",
    href: "/student",
    index: "01",
  },
  {
    label: "معلم",
    title: "محتوى صفّي قابل للاستخدام",
    text: "دروس وأسئلة وأهداف ووسائط مع أدوات متابعة للطلاب.",
    href: "/teacher",
    index: "02",
  },
  {
    label: "ولي أمر",
    title: "صورة مفهومة عن التقدم",
    text: "متابعة مرتبطة بالتعلم الحقيقي بدل أرقام منفصلة عن الدروس.",
    href: "/parent",
    index: "03",
  },
  {
    label: "مدرسة",
    title: "طبقة تعليم موحدة",
    text: "بوابة للمناهج والأدوار والمتابعة والمكافآت ضمن تجربة واحدة.",
    href: "/school",
    index: "04",
  },
];

const journey = [
  {
    step: "01",
    title: "حدّد مكانك",
    text: "الدولة، الصف، الدور والهدف.",
  },
  {
    step: "02",
    title: "ادخل الدرس",
    text: "شرح ومحتوى وتدريب ووسائط مرتبطة بالسياق.",
  },
  {
    step: "03",
    title: "اعرف خطوتك التالية",
    text: "تقدم وتقييم واقتراح واضح بدل التنقل العشوائي.",
  },
];

export default function HomePage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[#f7f1e6] text-[#202c29]"
    >
      <header className="sticky top-0 z-50 border-b border-[#d9ccb2]/80 bg-[#fffdf8]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <DadyoomLogo className="ml-auto" />

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden items-center gap-1 rounded-full border border-[#ddd0b7] bg-white/80 p-1 text-sm font-black text-[#625a50] lg:flex"
          >
            <a
              href="#experience"
              className="rounded-full px-4 py-2 transition hover:bg-[#f1e7d4] hover:text-[#123f39]"
            >
              التجربة
            </a>
            <a
              href="#roles"
              className="rounded-full px-4 py-2 transition hover:bg-[#f1e7d4] hover:text-[#123f39]"
            >
              لمن ضاديوم؟
            </a>
            <Link
              prefetch={false}
              href="/courses"
              className="rounded-full px-4 py-2 transition hover:bg-[#f1e7d4] hover:text-[#123f39]"
            >
              المناهج
            </Link>
            <Link
              prefetch={false}
              href="/pricing"
              className="rounded-full px-4 py-2 transition hover:bg-[#f1e7d4] hover:text-[#123f39]"
            >
              Plus
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              prefetch={false}
              href="/login"
              className="hidden rounded-full px-4 py-2.5 text-sm font-black text-[#4e4941] transition hover:bg-white sm:inline-flex"
            >
              دخول
            </Link>
            <Link
              prefetch={false}
              href="/signup"
              className="rounded-full bg-[#123f39] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#123f39]/15 transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              ابدأ مجانًا
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_12%,rgba(18,63,57,.15),transparent_28rem),radial-gradient(circle_at_12%_26%,rgba(198,154,69,.18),transparent_24rem),linear-gradient(180deg,#fffdf8_0%,#f5ecdc_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[34rem] opacity-45 [background-image:linear-gradient(rgba(18,63,57,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(18,63,57,.06)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8 lg:pb-28">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-[#cfb36f] bg-[#fffdf8]/90 px-4 py-2 text-xs font-black text-[#73551d] shadow-sm">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#174f47]"
              />
              منصة عربية تبدأ من المنهج ولا تنتهي عنده
            </div>

            <h1 className="mt-7 max-w-4xl font-arabic-display text-[2.65rem] font-black leading-[1.35] tracking-[-0.03em] text-[#123f39] sm:text-5xl lg:text-[4.35rem]">
              العربية التي تعرف
              <span className="block text-[#a7772f]">
                أين أنت وإلى أين تذهب
              </span>
            </h1>

            <p className="mt-6 max-w-2xl font-arabic-reading text-xl leading-10 text-[#5f5a51] sm:text-[1.35rem]">
              ضاديوم يجمع المنهج، والمهارات الأربع، وضاد الذكي، والتقييم
              والتقدم في رحلة واحدة؛ ليعرف الطالب ماذا يتعلم الآن، وليعرف
              المعلم وولي الأمر والمدرسة ماذا حدث بعد ذلك.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                prefetch={false}
                href="/signup"
                className="rounded-2xl bg-[#123f39] px-7 py-4 font-black text-white shadow-xl shadow-[#123f39]/15 transition hover:-translate-y-0.5 hover:bg-[#0b332e]"
              >
                ابدأ رحلتك
              </Link>
              <Link
                prefetch={false}
                href="/courses"
                className="rounded-2xl border border-[#cdbb96] bg-[#fffdf8] px-7 py-4 font-black text-[#3f493f] shadow-sm transition hover:-translate-y-0.5 hover:border-[#8ca99f]"
              >
                استكشف المناهج
              </Link>
              <Link
                prefetch={false}
                href="/ask"
                className="rounded-2xl px-6 py-4 font-black text-[#8b6426] transition hover:bg-[#fff8e8]"
              >
                اسأل ضاد ←
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#d8ccb5] pt-6 text-sm font-black text-[#625b51]">
              <Metric value="22/22" label="دولة جاهزة" />
              <span aria-hidden="true" className="hidden h-8 w-px bg-[#d7cab0] sm:block" />
              <Metric value="1–12" label="الصفوف" />
              <span aria-hidden="true" className="hidden h-8 w-px bg-[#d7cab0] sm:block" />
              <Metric value="4" label="مهارات مترابطة" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[36rem] lg:mx-0">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[3.5rem] bg-[#123f39]/8 blur-2xl"
            />

            <div className="overflow-hidden rounded-[2.25rem] border border-[#cfbf9e] bg-[#fffdf8] shadow-[0_32px_90px_rgba(18,63,57,.16)]">
              <div className="flex items-center justify-between border-b border-[#e4d8c0] px-5 py-4">
                <div className="flex items-center gap-3">
                  <DadyoomMark className="h-11 w-11 rounded-xl" />
                  <div>
                    <div className="font-black text-[#123f39]">
                      يومك في ضاديوم
                    </div>
                    <div className="text-xs font-bold text-[#837565]">
                      المسار يتغير مع تقدمك
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-[#e8f2ee] px-3 py-1.5 text-xs font-black text-[#174f47]">
                  جاهز للتعلّم
                </span>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="rounded-[1.7rem] bg-[#123f39] p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-[#f0cd7b]">
                        الخطوة الحالية
                      </div>
                      <h2 className="mt-2 text-2xl font-black">
                        اقرأ، افهم، ثم طبّق
                      </h2>
                    </div>
                    <div
                      aria-hidden="true"
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-2xl font-black"
                    >
                      ض
                    </div>
                  </div>
                  <p className="mt-3 max-w-md text-sm font-bold leading-7 text-[#dceae6]">
                    الدرس ليس ملفًا منفصلًا؛ الشرح والتدريب وضاد والتقدم
                    يتحركون معًا.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PreviewCard
                    eyebrow="المنهج"
                    title="الدولة ← الصف ← الوحدة ← الدرس"
                    value="مسار منظم"
                  />
                  <PreviewCard
                    eyebrow="التقدم"
                    title="ما أتقنته وما يحتاج مراجعة"
                    value="خطوتك التالية"
                  />
                </div>

                <div className="rounded-[1.5rem] border border-[#e1d4ba] bg-[#f8f1e5] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black text-[#98702b]">
                        ضاد
                      </div>
                      <div className="mt-1 font-black text-[#263c37]">
                        «اشرحها لي بطريقة أبسط»
                      </div>
                    </div>
                    <Link
                      prefetch={false}
                      href="/ask"
                      className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#123f39] shadow-sm"
                    >
                      ابدأ
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[#d8c7a4] bg-white px-4 py-3 shadow-xl sm:block">
              <div className="text-[11px] font-black text-[#9a712c]">
                ليس مجرد شات AI
              </div>
              <div className="mt-1 text-sm font-black text-[#123f39]">
                AI + منهج + تقدم + أدوار
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="experience"
        className="border-y border-[#ddd0b8] bg-[#123f39] py-20 text-white"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-black text-[#efcb79]">
                من أول نقرة إلى الإتقان
              </p>
              <h2 className="mt-3 font-arabic-display text-3xl font-black leading-[1.45] sm:text-4xl">
                تجربة واحدة لا مجموعة أدوات متفرقة
              </h2>
            </div>
            <p className="max-w-2xl font-arabic-reading text-lg leading-9 text-[#dce8e4]">
              بدل أن يبحث الطالب عن المنهج في مكان، والشرح في مكان، والذكاء
              الاصطناعي في مكان آخر، يبني ضاديوم السياق أولًا ثم يضع الأدوات
              داخله.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 lg:grid-cols-3">
            {journey.map((item) => (
              <article
                key={item.step}
                className="bg-[#123f39] p-7 sm:p-8"
              >
                <div className="text-sm font-black text-[#efcb79]">
                  {item.step}
                </div>
                <h3 className="mt-6 text-2xl font-black">
                  {item.title}
                </h3>
                <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#cfe0db]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black text-[#a7772f]">
              أربعة أدوار، نفس الحقيقة التعليمية
            </p>
            <h2 className="mt-3 font-arabic-display text-3xl font-black leading-[1.45] text-[#123f39] sm:text-4xl">
              كل شخص يرى ما يحتاجه دون أن تنفصل المنظومة
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <Link
                key={role.label}
                href={role.href}
                prefetch={false}
                className="group relative overflow-hidden rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#a99161] hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="text-xs font-black text-[#9a712c]">
                      {role.label}
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-[#123f39]">
                      {role.title}
                    </h3>
                    <p className="mt-3 max-w-xl font-arabic-reading text-lg leading-8 text-[#686057]">
                      {role.text}
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="text-4xl font-black text-[#123f39]/10 transition group-hover:text-[#a7772f]/30"
                  >
                    {role.index}
                  </div>
                </div>
                <div className="mt-6 text-sm font-black text-[#174f47]">
                  افتح المساحة ←
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeInteractionPanel />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-[#c7a95f] bg-[#fff7e5] p-8 shadow-[0_24px_70px_rgba(77,54,20,.10)] sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black text-[#9a712c]">
                البداية لا تحتاج إعدادًا معقدًا
              </p>
              <h2 className="mt-3 max-w-4xl font-arabic-display text-3xl font-black leading-[1.45] text-[#123f39] sm:text-4xl">
                اختر دولتك وصفك ودورك، ودع ضاديوم يرتب الباقي
              </h2>
            </div>
            <Link
              prefetch={false}
              href="/signup"
              className="inline-flex justify-center rounded-2xl bg-[#123f39] px-8 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              إنشاء حساب مجاني
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#315e57] bg-[#0c332e] py-10 text-[#d9e8e3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <DadyoomLogo inverse />
          <div className="text-sm font-bold">
            العربية لقلب الطالب قبل عقله.
          </div>
          <div className="text-sm">© 2026 ضاديوم</div>
        </div>
      </footer>
    </main>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-black text-[#123f39]">
        {value}
      </span>
      <span>{label}</span>
    </div>
  );
}

function PreviewCard({
  eyebrow,
  title,
  value,
}: {
  eyebrow: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#e1d4ba] bg-white p-4">
      <div className="text-[11px] font-black text-[#9a712c]">
        {eyebrow}
      </div>
      <div className="mt-2 text-sm font-black leading-6 text-[#263c37]">
        {title}
      </div>
      <div className="mt-4 text-xs font-bold text-[#756a5b]">
        {value}
      </div>
    </div>
  );
}
