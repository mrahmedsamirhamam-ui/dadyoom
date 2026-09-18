import Link from "next/link";

const features = [
  {
    href: "/ask",
    title: "🤖 اسأل ضاد",
    description:
      "افتح شات ضاد واسأل عن كلمة أو قاعدة أو تدريب.",
  },
  {
    href: "/courses",
    title: "📚 المناهج العربية",
    description:
      "تصفح المناهج والدروس المنشورة في ضاديوم.",
  },
  {
    href: "/dictionary",
    title: "📖 قاموس السياق",
    description:
      "اعرف معنى الكلمة داخل الجملة ومرادفاتها وأضدادها.",
  },
  {
    href: "/teacher/academy",
    title: "🎓 غرفة تدريب المعلم",
    description:
      "دورات واستراتيجيات ومواد تدريبية للمعلمين.",
  },
];

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="mb-12 text-center text-4xl font-bold text-teal-700">
        ماذا يقدم ضاديوم؟
      </h2>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map(
          (feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="touch-manipulation rounded-2xl bg-white p-6 shadow-lg transition hover:shadow-xl active:scale-[0.97] active:bg-teal-50"
            >
              <h3 className="mb-4 text-2xl font-bold">
                {feature.title}
              </h3>

              <p className="leading-8 text-gray-600">
                {feature.description}
              </p>

              <span className="mt-5 inline-block font-black text-teal-700">
                افتح الآن ←
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
