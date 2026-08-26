
import Link from "next/link";
import { notFound } from "next/navigation";

type SkillConfig = {
  title: string;
  icon: string;
  description: string;
  color: string;
  goals: string[];
  activities: string[];
  practiceHref: string;
  practiceLabel: string;
};

const skillConfig: Record<string, SkillConfig> = {
  reading: {
    title: "القراءة",
    icon: "📖",
    description: "تدريبات متدرجة تساعد الطالب على القراءة بطلاقة وفهم المعنى والأفكار.",
    color: "from-emerald-500 to-teal-600",
    goals: ["فهم الفكرة العامة", "استخراج التفاصيل", "فهم المفردات من السياق", "الاستنتاج والتفكير الناقد"],
    activities: ["نصوص قصيرة متدرجة", "أسئلة فهم المقروء", "ترتيب الأحداث", "معاني الكلمات في السياق"],
    practiceHref: "/skills/reading/practice",
    practiceLabel: "ابدأ تدريب القراءة",
  },
  writing: {
    title: "الكتابة",
    icon: "✍️",
    description: "مسار تدريبي لبناء الجملة والفقرة وتحسين الإملاء والتعبير.",
    color: "from-violet-500 to-purple-600",
    goals: ["كتابة جملة صحيحة", "تنظيم الأفكار", "تحسين الإملاء", "التعبير الكتابي والإبداعي"],
    activities: ["إكمال الجمل", "إعادة ترتيب الكلمات", "كتابة فقرة", "وصف صورة أو موقف"],
    practiceHref: "/skills/writing/practice",
    practiceLabel: "ابدأ تدريب الكتابة",
  },
  listening: {
    title: "الاستماع",
    icon: "🎧",
    description: "استماع موجّه إلى العربية الفصحى مع أنشطة للفهم والتمييز والاستجابة.",
    color: "from-sky-500 to-blue-600",
    goals: ["فهم النص المسموع", "تمييز الأصوات والكلمات", "استخراج المعلومات", "الاستجابة لما يسمعه الطالب"],
    activities: ["استمع واختر", "استمع ورتب", "استمع وأكمل", "استمع وأجب"],
    practiceHref: "/skills/listening/practice",
    practiceLabel: "ابدأ مختبر الاستماع",
  },
  speaking: {
    title: "التحدث",
    icon: "🎙️",
    description: "مساحة للتدريب على النطق والطلاقة والحوار والتعبير الشفهي.",
    color: "from-orange-500 to-rose-600",
    goals: ["نطق الكلمات بوضوح", "التحدث بجمل سليمة", "التعبير عن الأفكار", "المشاركة في الحوار"],
    activities: ["كرر بعد ضاد", "صف الصورة", "أجب بصوتك", "حوار قصير"],
    practiceHref: "/skills/speaking/practice",
    practiceLabel: "ابدأ تدريب التحدث",
  },
};

type Props = { params: Promise<{ skill: string }> };

export default async function SkillPage({ params }: Props) {
  const { skill } = await params;
  const config = skillConfig[skill];
  if (!config) notFound();

  return (
    <main dir="rtl" className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <Link href="/skills" className="font-black text-violet-700 hover:underline">
        ← العودة إلى المهارات الأربع
      </Link>

      <section className={`mt-5 rounded-3xl bg-gradient-to-l ${config.color} p-7 text-white shadow-xl sm:p-10`}>
        <div className="flex items-center gap-5">
          <span className="text-6xl">{config.icon}</span>
          <div>
            <p className="text-sm font-black text-white/80">مركز المهارات</p>
            <h1 className="mt-1 text-4xl font-black">مهارة {config.title}</h1>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-lg leading-9 text-white/90">{config.description}</p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">ماذا ستتعلم؟</h2>
          <div className="mt-5 space-y-3">
            {config.goals.map((goal, index) => (
              <div key={goal} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 font-black text-violet-700">{index + 1}</span>
                <span className="font-bold text-slate-800">{goal}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900">تدريبات هذه المهارة</h2>
          <div className="mt-5 grid gap-3">
            {config.activities.map((activity) => (
              <div key={activity} className="rounded-2xl border border-slate-200 p-4 font-bold text-slate-800">{activity}</div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
        <p className="text-sm font-black text-violet-300">تدريب فعلي متصل بتقدمك</p>
        <h2 className="mt-2 text-2xl font-black">ابدأ التدريب الآن، ثم انتقل إلى المسار التكيفي</h2>
        <p className="mt-3 max-w-3xl leading-8 text-slate-300">
          تدريبات ضاديوم الحالية مرتبطة بالممارسة والتقييم والتقدم، ويمكن للمسار التكيفي اقتراح الخطوة التالية حسب مستواك.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={config.practiceHref} className="inline-flex rounded-2xl bg-violet-500 px-6 py-3 font-black text-white transition hover:bg-violet-400">
            {config.practiceLabel}
          </Link>
          <Link href="/skills/adaptive" className="inline-flex rounded-2xl bg-white px-6 py-3 font-black text-slate-900 transition hover:bg-slate-100">
            المسار التكيفي
          </Link>
          <Link href="/courses" className="inline-flex rounded-2xl border border-white/30 px-6 py-3 font-black text-white transition hover:bg-white/10">
            استكشف الدروس
          </Link>
        </div>
      </section>
    </main>
  );
}
