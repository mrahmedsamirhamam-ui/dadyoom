import Link from "next/link";

const skills = [
  {
    key: "reading",
    icon: "📖",
    title: "القراءة",
    description:
      "اقرأ نصوصًا متدرجة، وافهم الأفكار والمعاني، وطوّر الطلاقة والفهم القرائي.",
    features: [
      "فهم المقروء",
      "المفردات",
      "الطلاقة",
      "التفكير الناقد",
    ],
    className:
      "from-emerald-500 to-teal-600",
  },
  {
    key: "writing",
    icon: "✍️",
    title: "الكتابة",
    description:
      "تدرّب على بناء الجملة والفقرة والتعبير، وطوّر كتابتك خطوة بعد خطوة.",
    features: [
      "بناء الجملة",
      "الإملاء",
      "التعبير",
      "الكتابة الإبداعية",
    ],
    className:
      "from-violet-500 to-purple-600",
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
      "التقاط التفاصيل",
      "الاستجابة",
    ],
    className:
      "from-sky-500 to-blue-600",
  },
  {
    key: "speaking",
    icon: "🎙️",
    title: "التحدث",
    description:
      "تدرّب على النطق والتعبير الشفهي والحوار بثقة وبالعربية الفصحى.",
    features: [
      "النطق",
      "الطلاقة",
      "الحوار",
      "التعبير الشفهي",
    ],
    className:
      "from-orange-500 to-rose-600",
  },
];

export default function SkillsPage() {
  return (
    <main
      dir="rtl"
      className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-indigo-950 to-violet-900 p-7 text-white shadow-xl sm:p-10">
        <p className="text-sm font-black text-violet-200">
          ضاديوم • تعلّم العربية بالممارسة
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-5xl">
          مركز المهارات الأربع
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-9 text-slate-200">
          اختر المهارة التي تريد تطويرها، وابدأ رحلة
          تدريب متدرجة في القراءة والكتابة والاستماع
          والتحدث.
        </p>

        <div className="mt-7 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-full bg-white/10 px-4 py-2">
            📖 اقرأ
          </span>

          <span className="rounded-full bg-white/10 px-4 py-2">
            ✍️ اكتب
          </span>

          <span className="rounded-full bg-white/10 px-4 py-2">
            🎧 استمع
          </span>

          <span className="rounded-full bg-white/10 px-4 py-2">
            🎙️ تحدث
          </span>
        </div>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-2">
        {skills.map((skill) => (
          <Link
            key={skill.key}
            href={`/skills/${skill.key}`}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className={`bg-gradient-to-l ${skill.className} p-6 text-white`}
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl">
                  {skill.icon}
                </span>

                <div>
                  <p className="text-sm font-bold text-white/80">
                    مهارة أساسية
                  </p>

                  <h2 className="text-3xl font-black">
                    {skill.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="leading-8 text-slate-600">
                {skill.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {skill.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-6 font-black text-violet-700">
                ابدأ التدريب ←
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
