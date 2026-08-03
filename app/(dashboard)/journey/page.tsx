import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const stages = [
  {
    id: 1,
    title: "بوابة ضاديوم",
    subtitle: "بداية الرحلة",
    icon: "🏛️",
    description: "تعرّف على رحلتك التعليمية وحدد هدفك.",
    href: "/student",
    requiredLessons: 0,
  },
  {
    id: 2,
    title: "مدينة الحروف",
    subtitle: "الحروف والأصوات",
    icon: "🌱",
    description: "تعلّم الحروف العربية وأصواتها وطريقة كتابتها.",
    href: "/courses?stage=letters",
    requiredLessons: 1,
  },
  {
    id: 3,
    title: "وادي القراءة",
    subtitle: "القراءة والفهم",
    icon: "📖",
    description: "طوّر مهارات القراءة وفهم النصوص والمفردات.",
    href: "/courses?stage=reading",
    requiredLessons: 4,
  },
  {
    id: 4,
    title: "واحة الكتابة",
    subtitle: "الكتابة والإملاء",
    icon: "✍️",
    description: "تدرّب على الإملاء وتكوين الجمل والكتابة السليمة.",
    href: "/courses?stage=writing",
    requiredLessons: 8,
  },
  {
    id: 5,
    title: "جبل التعبير",
    subtitle: "التحدث والتعبير",
    icon: "🗣️",
    description: "عبّر عن أفكارك بثقة شفهياً وكتابياً.",
    href: "/courses?stage=speaking",
    requiredLessons: 12,
  },
  {
    id: 6,
    title: "مكتبة العربية",
    subtitle: "النحو والأدب",
    icon: "📚",
    description: "اكتشف النحو والأدب والقصص العربية.",
    href: "/courses?stage=library",
    requiredLessons: 16,
  },
  {
    id: 7,
    title: "قصر البلاغة",
    subtitle: "مرحلة الإتقان",
    icon: "🏆",
    description: "أكمل التحديات النهائية واحصل على شهادة الإنجاز.",
    href: "/courses?stage=mastery",
    requiredLessons: 20,
  },
];

export default async function JourneyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { count } = await supabase
    .from("student_progress")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("completed", true);

  const completedLessons = count ?? 0;

  const currentStageIndex = stages.reduce((currentIndex, stage, index) => {
    if (completedLessons >= stage.requiredLessons) {
      return index;
    }

    return currentIndex;
  }, 0);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <p className="text-sm font-bold text-teal-700">
            ضاديوم — بيت العربية الرقمي
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-5xl">
            رحلة الضاد
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
            تقدّم خطوة بعد خطوة، وأكمل الدروس لفتح مراحل جديدة في رحلتك
            نحو إتقان اللغة العربية.
          </p>

          <div className="mx-auto mt-6 max-w-xl">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>تقدمك في الرحلة</span>
              <span>{completedLessons} درسًا مكتملًا</span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-l from-teal-700 to-amber-400 transition-all duration-700"
                style={{
                  width: `${Math.min(
                    (completedLessons / 20) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </header>

        <section className="relative">
          <div className="absolute bottom-20 right-1/2 top-20 hidden w-1 translate-x-1/2 rounded-full bg-slate-200 md:block" />

          <div className="space-y-8">
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isLocked = index > currentStageIndex;

              return (
                <article
                  key={stage.id}
                  className={`relative z-10 flex ${
                    index % 2 === 0
                      ? "md:justify-start"
                      : "md:justify-end"
                  }`}
                >
                  <div
                    className={`w-full rounded-3xl border p-6 shadow-sm transition md:w-[46%] ${
                      isCurrent
                        ? "border-teal-500 bg-white ring-4 ring-teal-100"
                        : isCompleted
                        ? "border-amber-300 bg-amber-50"
                        : "border-slate-200 bg-slate-100 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl ${
                          isCurrent
                            ? "bg-teal-700 text-white"
                            : isCompleted
                            ? "bg-amber-200"
                            : "bg-slate-200"
                        }`}
                      >
                        {isLocked ? "🔒" : stage.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black">
                            {stage.title}
                          </h2>

                          {isCompleted && (
                            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                              مكتملة
                            </span>
                          )}

                          {isCurrent && (
                            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800">
                              مرحلتك الحالية
                            </span>
                          )}

                          {isLocked && (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                              مغلقة
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm font-semibold text-teal-700">
                          {stage.subtitle}
                        </p>

                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {stage.description}
                        </p>

                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          شرط الفتح: إكمال {stage.requiredLessons} من الدروس
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      {isLocked ? (
                        <button
                          disabled
                          className="w-full cursor-not-allowed rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-500"
                        >
                          أكمل المرحلة السابقة أولًا
                        </button>
                      ) : (
                        <Link
                          href={stage.href}
                          className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-bold transition ${
                            isCurrent
                              ? "bg-teal-700 text-white hover:bg-teal-800"
                              : "bg-amber-200 text-amber-950 hover:bg-amber-300"
                          }`}
                        >
                          {isCurrent ? "ابدأ المرحلة" : "مراجعة المرحلة"}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div
                    className={`absolute right-1/2 top-10 hidden h-6 w-6 translate-x-1/2 rounded-full border-4 border-white md:block ${
                      isCurrent
                        ? "bg-teal-600"
                        : isCompleted
                        ? "bg-amber-400"
                        : "bg-slate-300"
                    }`}
                  />
                </article>
              );
            })}
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link
            href="/student"
            className="inline-flex items-center justify-center rounded-2xl border border-teal-700 px-6 py-3 font-bold text-teal-700 transition hover:bg-teal-50"
          >
            العودة إلى لوحة الطالب
          </Link>
        </div>
      </div>
    </main>
  );
}