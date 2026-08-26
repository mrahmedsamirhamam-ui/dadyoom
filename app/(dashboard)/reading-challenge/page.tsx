import Link from "next/link";
import { redirect } from "next/navigation";

import { saveReadingPassportEntry } from "@/features/reading-challenge/actions/saveReadingPassportEntry";
import { createClient } from "@/lib/supabase/server";

type ReadingLesson = {
  id: string;
  title: string;
  summary: string | null;
  estimated_minutes: number | null;
  lesson_number: number | null;
};

type PassportEntry = {
  lesson_id: string;
  summary: string | null;
  critical_reflection: string | null;
  creative_response: string | null;
  comprehension_score: number | null;
  status: string;
  completed_at: string | null;
};

export default async function ReadingChallengePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    lessonsResult,
    progressResult,
    passportResult,
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        "id,title,summary,estimated_minutes,lesson_number"
      )
      .eq("status", "published")
      .eq("lesson_type", "reading")
      .order("lesson_number", {
        ascending: true,
        nullsFirst: false,
      })
      .limit(40),

    supabase
      .from("student_lesson_progress")
      .select(
        "lesson_id,status,progress_percent,best_score,xp,completed_at"
      )
      .eq("student_id", user.id),

    supabase
      .from("reading_passport_entries")
      .select(
        "lesson_id,summary,critical_reflection,creative_response,comprehension_score,status,completed_at"
      )
      .eq("student_id", user.id),
  ]);

  if (lessonsResult.error) {
    throw new Error(lessonsResult.error.message);
  }

  const lessons =
    (lessonsResult.data ?? []) as ReadingLesson[];

  const progressByLesson =
    new Map(
      (progressResult.data ?? []).map(
        (row) => [
          row.lesson_id,
          row,
        ]
      )
    );

  const passportByLesson =
    new Map(
      (
        (passportResult.data ?? []) as PassportEntry[]
      ).map(
        (row) => [
          row.lesson_id,
          row,
        ]
      )
    );

  const completedLessons =
    lessons.filter(
      (lesson) => {
        const status =
          progressByLesson.get(lesson.id)?.status;

        return (
          status === "completed" ||
          status === "mastered"
        );
      }
    ).length;

  const completedPassports =
    Array.from(
      passportByLesson.values()
    ).filter(
      (entry) =>
        entry.status === "completed"
    ).length;

  const scoredEntries =
    Array.from(
      passportByLesson.values()
    )
      .map(
        (entry) =>
          entry.comprehension_score
      )
      .filter(
        (
          score
        ): score is number =>
          typeof score === "number"
      );

  const averageScore =
    scoredEntries.length > 0
      ? Math.round(
          scoredEntries.reduce(
            (sum, score) =>
              sum + score,
            0
          ) /
            scoredEntries.length
        )
      : 0;

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

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
                تحدي القراءة العربي داخل ضاديوم
              </span>

              <h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">
                جواز القراءة
              </h1>

              <p className="mt-4 max-w-3xl font-arabic-reading text-xl leading-9 text-[#e7f1ed]">
                اقرأ، افهم، لخّص، فكّر ثم أبدع. كل نص تقرؤه يضيف محطة
                جديدة إلى جوازك، ويجمع بين الفهم القرائي والتفكير الناقد
                والاستجابة الإبداعية.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric value={completedLessons} label="دروس قراءة" />
              <Metric value={completedPassports} label="جوازات مكتملة" />
              <Metric value={averageScore} label="متوسط الفهم" suffix="%" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <PurposeCard
            icon="📖"
            title="القراءة المتدرجة"
            text="ابدأ بالنص المناسب لمستواك ثم انتقل تدريجيًا إلى نصوص أعمق."
          />
          <PurposeCard
            icon="🧠"
            title="الفهم والتحليل"
            text="راجع فكرتك الرئيسة والتفاصيل والمعنى الذي فهمته من السياق."
          />
          <PurposeCard
            icon="🔎"
            title="التفكير الناقد"
            text="اكتب سؤالًا أو رأيًا أو ملاحظة تكشف أنك تجاوزت الحفظ إلى الفهم."
          />
          <PurposeCard
            icon="✨"
            title="التفكير الإبداعي"
            text="اقترح نهاية، عنوانًا، موقفًا أو فكرة جديدة مستوحاة من النص."
          />
        </section>

        {lessons.length === 0 ? (
          <section className="rounded-[2rem] border border-dashed border-[#d5c29b] bg-[#fffdf7] p-10 text-center">
            <div className="text-5xl">📚</div>
            <h2 className="mt-4 text-2xl font-black text-[#123f39]">
              لا توجد دروس قراءة منشورة بعد
            </h2>
            <p className="mt-2 text-[#746a5e]">
              عندما تُنشر حزم القراءة الموثقة ستظهر هنا تلقائيًا.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {lessons.map(
              (
                lesson,
                index
              ) => {
                const progress =
                  progressByLesson.get(
                    lesson.id
                  );

                const passport =
                  passportByLesson.get(
                    lesson.id
                  );

                const lessonDone =
                  progress?.status ===
                    "completed" ||
                  progress?.status ===
                    "mastered";

                return (
                  <article
                    key={lesson.id}
                    className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] shadow-sm"
                  >
                    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)] lg:p-7">
                      <div>
                        <div className="flex items-start gap-4">
                          <div
                            className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black ${
                              lessonDone
                                ? "bg-[#e1f1e8] text-[#176345]"
                                : "bg-[#f3e8ce] text-[#8d6725]"
                            }`}
                          >
                            {lessonDone
                              ? "✓"
                              : index + 1}
                          </div>

                          <div>
                            <p className="text-xs font-black text-[#9b7128]">
                              محطة قراءة •{" "}
                              {lesson.estimated_minutes ??
                                15}{" "}
                              دقيقة
                            </p>

                            <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
                              {lesson.title}
                            </h2>

                            <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#6e665d]">
                              {lesson.summary ??
                                "نص قراءة ضمن مسارك العربي في ضاديوم."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          <Link
                            href={`/lessons/${lesson.id}`}
                            className="rounded-full bg-[#123f39] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0c332e]"
                          >
                            افتح النص والدرس
                          </Link>

                          <Link
                            href={`/assessment/${lesson.id}`}
                            className="rounded-full border border-[#d5c19a] bg-[#fffaf0] px-5 py-3 text-sm font-black text-[#6f572d] transition hover:border-[#ad833b]"
                          >
                            اختبر فهمي
                          </Link>

                          <Link
                            href="/dictionary"
                            className="rounded-full border border-[#d5c19a] bg-white px-5 py-3 text-sm font-black text-[#315f57]"
                          >
                            قاموس السياق
                          </Link>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <SmallStat
                            label="تقدم الدرس"
                            value={`${Number(
                              progress?.progress_percent ??
                                0
                            )}%`}
                          />
                          <SmallStat
                            label="أفضل نتيجة"
                            value={
                              progress?.best_score ??
                              "—"
                            }
                          />
                          <SmallStat
                            label="XP"
                            value={
                              progress?.xp ??
                              0
                            }
                          />
                        </div>
                      </div>

                      <form
                        action={
                          saveReadingPassportEntry
                        }
                        className="rounded-[1.6rem] border border-[#e2d5bd] bg-white p-5"
                      >
                        <input
                          type="hidden"
                          name="lesson_id"
                          value={lesson.id}
                        />

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black text-[#a17425]">
                              جواز القراءة
                            </p>
                            <h3 className="mt-1 text-lg font-black text-[#123f39]">
                              سجّل أثر القراءة
                            </h3>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              passport?.status ===
                              "completed"
                                ? "bg-[#e3f2e8] text-[#1b6748]"
                                : "bg-[#f5eddc] text-[#816329]"
                            }`}
                          >
                            {passport?.status ===
                            "completed"
                              ? "مكتمل"
                              : "قيد الرحلة"}
                          </span>
                        </div>

                        <Field
                          name="summary"
                          label="ملخصي"
                          placeholder="اكتب الفكرة الرئيسة للنص بأسلوبك..."
                          defaultValue={
                            passport?.summary ?? ""
                          }
                        />

                        <Field
                          name="critical_reflection"
                          label="تفكيري الناقد"
                          placeholder="ما الرأي أو السؤال أو الفكرة التي تستحق النقاش؟"
                          defaultValue={
                            passport?.critical_reflection ??
                            ""
                          }
                        />

                        <Field
                          name="creative_response"
                          label="لمستي الإبداعية"
                          placeholder="اقترح عنوانًا أو نهاية أو موقفًا جديدًا..."
                          defaultValue={
                            passport?.creative_response ??
                            ""
                          }
                        />

                        <label className="mt-4 block">
                          <span className="mb-2 block text-xs font-black text-[#62584b]">
                            تقديري لفهمي من 100
                          </span>

                          <input
                            name="comprehension_score"
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={
                              passport?.comprehension_score ??
                              ""
                            }
                            className="w-full rounded-2xl border border-[#d9c8a7] bg-[#fffdf8] px-4 py-3 font-black outline-none focus:border-[#4c887c] focus:ring-4 focus:ring-[#174f47]/10"
                          />
                        </label>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="submit"
                            name="status"
                            value="started"
                            className="rounded-2xl border border-[#d7c49d] bg-[#fffaf0] px-4 py-3 text-sm font-black text-[#715a31]"
                          >
                            حفظ ومتابعة
                          </button>

                          <button
                            type="submit"
                            name="status"
                            value="completed"
                            className="rounded-2xl bg-[#123f39] px-4 py-3 text-sm font-black text-white"
                          >
                            ختم هذه المحطة
                          </button>
                        </div>
                      </form>
                    </div>
                  </article>
                );
              }
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="min-w-[80px] rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur">
      <div className="text-xl font-black text-[#f5cf7a]">
        {value}
        {suffix}
      </div>
      <div className="mt-1 text-[10px] font-bold text-[#e6f1ed]">
        {label}
      </div>
    </div>
  );
}

function PurposeCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
      <div className="text-3xl">{icon}</div>
      <h2 className="mt-3 font-arabic-display text-lg font-black text-[#123f39]">
        {title}
      </h2>
      <p className="mt-2 font-arabic-reading text-base leading-7 text-[#746a5e]">
        {text}
      </p>
    </article>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f0e4] p-3">
      <div className="text-[10px] font-black text-[#8a7960]">
        {label}
      </div>
      <div className="mt-1 text-lg font-black text-[#123f39]">
        {value}
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-2 block text-xs font-black text-[#62584b]">
        {label}
      </span>
      <textarea
        name={name}
        rows={3}
        maxLength={4000}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full resize-y rounded-2xl border border-[#d9c8a7] bg-[#fffdf8] px-4 py-3 font-arabic-reading text-base leading-7 outline-none transition focus:border-[#4c887c] focus:ring-4 focus:ring-[#174f47]/10"
      />
    </label>
  );
}
