"use client";

import { useState } from "react";

type LessonPack = {
  title: string;
  durationMinutes: number;
  objectives: Array<{
    domain: string;
    bloom: string;
    text: string;
  }>;
  icebreaker: {
    title: string;
    minutes: number;
    instructions: string;
  };
  timeline: Array<{
    minutes: number;
    phase: string;
    teacherAction: string;
    studentAction: string;
    assessment: string;
  }>;
  differentiation: {
    support: string[];
    core: string[];
    extension: string[];
  };
  criticalThinking: string[];
  worksheet: Array<{
    type: string;
    prompt: string;
    options: string[];
    answer: string;
  }>;
  quiz: Array<{
    question: string;
    answer: string;
  }>;
  homework: string;
  slides: Array<{
    title: string;
    bullets: string[];
    interaction: string;
  }>;
};

export default function TeacherLessonPackClient({
  lessonId,
  lessonTitle,
}: {
  lessonId: string;
  lessonTitle: string;
}) {
  const [durationMinutes, setDurationMinutes] = useState(55);
  const [classProfile, setClassProfile] = useState<
    "support" | "mixed" | "advanced"
  >("mixed");
  const [pack, setPack] = useState<LessonPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generatePack() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/teacher/lesson-pack", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          durationMinutes,
          classProfile,
        }),
      });

      const data = (await response.json()) as
        | LessonPack
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "تعذر إنشاء الحزمة.",
        );
      }

      setPack(data as LessonPack);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر إنشاء الحزمة.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-black text-emerald-700">
          الدرس المختار
        </p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">
          {lessonTitle}
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="font-bold text-slate-700">
            مدة الحصة
            <select
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value={45}>45 دقيقة</option>
              <option value={55}>55 دقيقة</option>
              <option value={60}>60 دقيقة</option>
              <option value={75}>75 دقيقة</option>
              <option value={90}>90 دقيقة</option>
            </select>
          </label>

          <label className="font-bold text-slate-700">
            مستوى الصف
            <select
              value={classProfile}
              onChange={(event) =>
                setClassProfile(
                  event.target.value as
                    | "support"
                    | "mixed"
                    | "advanced",
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value="support">يحتاج دعمًا</option>
              <option value="mixed">مختلط المستويات</option>
              <option value="advanced">متقدم</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={generatePack}
          disabled={loading}
          className="mt-5 rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "ضاديوم يبني الحزمة..."
            : "✨ أنشئ حزمة الدرس بالذكاء الاصطناعي"}
        </button>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 font-bold text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <a
          href={"/api/lessons/" + lessonId + "/pptx"}
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-800"
        >
          PowerPoint
        </a>
        <a
          href={"/assessment/" + lessonId}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-800"
        >
          التقويم
        </a>
        <a
          href={"/lessons/" + lessonId + "/games"}
          className="rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-sm font-black text-fuchsia-800"
        >
          الألعاب التعليمية
        </a>
        <a
          href={"/api/qr/lesson/" + lessonId + "?download=1"}
          className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-800"
        >
          تنزيل QR
        </a>
        <a
          href={"/lessons/" + lessonId}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
        >
          فتح الدرس
        </a>
        {pack ? (
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white"
          >
            طباعة الحزمة
          </button>
        ) : null}
      </div>

      {pack ? (
        <div className="space-y-6 print:space-y-4">
          <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-black text-teal-700">
              Dadyoom Teacher Studio
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              {pack.title}
            </h2>
            <p className="mt-2 font-bold text-slate-500">
              مدة الحصة: {pack.durationMinutes} دقيقة
            </p>
          </header>

          <PackSection title="الأهداف التعليمية">
            <div className="grid gap-3 md:grid-cols-3">
              {pack.objectives.map((objective, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-50 p-4"
                >
                  <p className="text-xs font-black text-teal-700">
                    {objective.domain} • {objective.bloom}
                  </p>
                  <p className="mt-2 leading-7 text-slate-700">
                    {objective.text}
                  </p>
                </div>
              ))}
            </div>
          </PackSection>

          <PackSection title="كسر الجمود والتهيئة">
            <h3 className="font-black text-slate-900">
              {pack.icebreaker.title} — {pack.icebreaker.minutes} دقائق
            </h3>
            <p className="mt-2 leading-7 text-slate-700">
              {pack.icebreaker.instructions}
            </p>
          </PackSection>

          <PackSection title="سير الحصة">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="p-3 text-right">الوقت</th>
                    <th className="p-3 text-right">المرحلة</th>
                    <th className="p-3 text-right">المعلم</th>
                    <th className="p-3 text-right">الطلاب</th>
                    <th className="p-3 text-right">التقويم</th>
                  </tr>
                </thead>
                <tbody>
                  {pack.timeline.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-3 font-black">{item.minutes} د</td>
                      <td className="p-3 font-black">{item.phase}</td>
                      <td className="p-3">{item.teacherAction}</td>
                      <td className="p-3">{item.studentAction}</td>
                      <td className="p-3">{item.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PackSection>

          <PackSection title="التمايز">
            <div className="grid gap-4 md:grid-cols-3">
              <SimpleList title="دعم" items={pack.differentiation.support} />
              <SimpleList title="المستوى المتوقع" items={pack.differentiation.core} />
              <SimpleList title="إثراء" items={pack.differentiation.extension} />
            </div>
          </PackSection>

          <PackSection title="أسئلة التفكير الناقد">
            <SimpleList items={pack.criticalThinking} />
          </PackSection>

          <PackSection title="ورقة العمل">
            <ol className="space-y-4">
              {pack.worksheet.map((item, index) => (
                <li key={index} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-black text-slate-900">
                    {index + 1}. {item.prompt}
                  </p>
                  {item.options?.length ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {item.options.join(" • ")}
                    </p>
                  ) : null}
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-black text-teal-700">
                      الإجابة
                    </summary>
                    <p className="mt-2 text-slate-700">{item.answer}</p>
                  </details>
                </li>
              ))}
            </ol>
          </PackSection>

          <PackSection title="التقويم الختامي">
            <ol className="space-y-3">
              {pack.quiz.map((item, index) => (
                <li key={index} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-black">
                    {index + 1}. {item.question}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    الإجابة: {item.answer}
                  </p>
                </li>
              ))}
            </ol>
          </PackSection>

          <PackSection title="الواجب المنزلي">
            <p className="leading-8 text-slate-700">{pack.homework}</p>
          </PackSection>

          <PackSection title="مخطط العرض الإلكتروني">
            <div className="grid gap-3 md:grid-cols-2">
              {pack.slides.map((slide, index) => (
                <article
                  key={index}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-black text-indigo-600">
                    شريحة {index + 1}
                  </p>
                  <h3 className="mt-1 font-black text-slate-900">
                    {slide.title}
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pr-5 text-sm text-slate-700">
                    {slide.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-bold text-teal-700">
                    تفاعل: {slide.interaction}
                  </p>
                </article>
              ))}
            </div>
          </PackSection>
        </div>
      ) : null}
    </section>
  );
}

function PackSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-4 text-2xl font-black text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function SimpleList({
  title,
  items,
}: {
  title?: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      {title ? (
        <h3 className="mb-2 font-black text-slate-900">{title}</h3>
      ) : null}
      <ul className="list-disc space-y-2 pr-5 leading-7 text-slate-700">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
