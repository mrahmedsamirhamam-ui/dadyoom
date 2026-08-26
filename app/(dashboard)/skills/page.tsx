import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "المهارات الأربع",
  description:
    "تدرب على القراءة والكتابة والاستماع والتحدث في مركز مهارات ضاديوم.",
  alternates: {
    canonical: "/skills",
  },
};

const skills = [
  {
    key: "reading",
    icon: "📖",
    title: "القراءة",
    description:
      "اقرأ نصوصًا متدرجة وافهم الأفكار والمعاني وطوّر الطلاقة والتفكير الناقد.",
    features: [
      "فهم المقروء",
      "المفردات",
      "الطلاقة",
      "التفكير الناقد",
    ],
  },
  {
    key: "writing",
    icon: "✍️",
    title: "الكتابة",
    description:
      "تدرّب على بناء الجملة والفقرة والإملاء والتعبير والكتابة الإبداعية.",
    features: [
      "بناء الجملة",
      "الإملاء",
      "التعبير",
      "الكتابة الإبداعية",
    ],
  },
  {
    key: "listening",
    icon: "🎧",
    title: "الاستماع",
    description:
      "استمع إلى العربية الفصحى وافهم الكلمات والأفكار والتفاصيل من السياق.",
    features: [
      "تمييز الأصوات",
      "فهم المسموع",
      "التفاصيل",
      "الاستجابة",
    ],
  },
  {
    key: "speaking",
    icon: "🎙️",
    title: "التحدث",
    description:
      "تدرّب على النطق والطلاقة والحوار والتعبير الشفهي بالعربية الفصحى.",
    features: [
      "النطق",
      "الطلاقة",
      "الحوار",
      "التعبير الشفهي",
    ],
  },
];

export default function SkillsPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen px-4 py-7 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />
          <div className="relative">
            <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
              تعلّم العربية بالممارسة
            </span>
            <h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">
              مركز المهارات الأربع
            </h1>
            <p className="mt-4 max-w-3xl font-arabic-reading text-xl leading-9 text-[#e7f1ed]">
              المنهج يخبرك ماذا تتعلم، وهنا تتدرّب كيف تستخدم العربية:
              اقرأ، اكتب، استمع وتحدث.
            </p>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {skills.map(
            (skill) => (
              <Link
                key={skill.key}
                href={`/skills/${skill.key}`}
                className="group rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#b9944e] hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#123f39] text-3xl shadow-sm">
                    {skill.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#a17425]">
                      مهارة أساسية
                    </p>
                    <h2 className="mt-1 font-arabic-display text-3xl font-black text-[#123f39]">
                      {skill.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-5 font-arabic-reading text-lg leading-8 text-[#73695d]">
                  {skill.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {skill.features.map(
                    (feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-[#dfcfad] bg-[#fffaf0] px-3 py-2 text-sm font-black text-[#6e5b39]"
                      >
                        {feature}
                      </span>
                    )
                  )}
                </div>

                <div className="mt-6 font-black text-[#8a6527]">
                  ابدأ التدريب ←
                </div>
              </Link>
            )
          )}
        </section>

        <section className="arabic-panel flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-[#dfcfad] p-6">
          <div>
            <p className="text-xs font-black text-[#a17425]">
              لا تعرف من أين تبدأ؟
            </p>
            <h2 className="mt-1 text-xl font-black text-[#123f39]">
              دع ضاديوم يختار لك التدريب الأنسب
            </h2>
          </div>
          <Link
            href="/skills/adaptive"
            className="rounded-full bg-[#123f39] px-6 py-3 text-sm font-black text-white"
          >
            ابدأ التدريب التكيفي
          </Link>
        </section>
      </div>
    </main>
  );
}
