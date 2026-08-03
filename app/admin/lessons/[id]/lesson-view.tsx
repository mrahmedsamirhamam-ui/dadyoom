"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type VocabularyItem = {
  word: string;
  meaning: string;
  example: string;
};

type ActivityItem = {
  title: string;
  instructions: string;
};

type AssessmentItem = {
  question: string;
  answer: string;
};

type Lesson = {
  id: string;
  title: string;
  skill: string;
  difficultyLevel: string;
  estimatedMinutes: number;
  points: number;
  objectives: string[];
  introduction: string;
  explanation: string;
  vocabulary: VocabularyItem[];
  activities: ActivityItem[];
  assessment: AssessmentItem[];
  homework: string;
};

type LessonViewProps = {
  lesson: Lesson;
};

const skillLabels: Record<string, string> = {
  reading: "القراءة",
  writing: "الكتابة",
  listening: "الاستماع",
  speaking: "التحدث",
  grammar: "القواعد",
  vocabulary: "المفردات",
  general: "مهارات اللغة العربية",
};

const difficultyLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[.,،؛;:!?؟]/g, "")
    .replace(/\s+/g, " ");
}

export default function LessonView({ lesson }: LessonViewProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isChecked, setIsChecked] = useState(false);

  const score = useMemo(() => {
    if (!isChecked || lesson.assessment.length === 0) return 0;

    return lesson.assessment.reduce((total, item, index) => {
      const userAnswer = normalizeAnswer(answers[index] ?? "");
      const correctAnswer = normalizeAnswer(item.answer);
      return total + (userAnswer && userAnswer === correctAnswer ? 1 : 0);
    }, 0);
  }, [answers, isChecked, lesson.assessment]);

  const percentage = lesson.assessment.length
    ? Math.round((score / lesson.assessment.length) * 100)
    : 0;

  return (
    <main dir="rtl" className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
              {skillLabels[lesson.skill] ?? lesson.skill}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              المستوى: {difficultyLabels[lesson.difficultyLevel] ?? lesson.difficultyLevel}
            </span>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-primary">ضاديوم · بيت العربية الرقمي</p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{lesson.title}</h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">مدة الدرس</p>
              <p className="mt-1 text-lg font-bold">⏱️ {lesson.estimatedMinutes} دقيقة</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">نقاط الدرس</p>
              <p className="mt-1 text-lg font-bold">⭐ {lesson.points} نقطة</p>
            </div>
            <div className="rounded-2xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">عدد الأنشطة</p>
              <p className="mt-1 text-lg font-bold">🎮 {lesson.activities.length} نشاط</p>
            </div>
          </div>
        </div>
      </header>

      {lesson.objectives.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">🎯 أهداف الدرس</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {lesson.objectives.map((objective, index) => (
              <div key={`${objective}-${index}`} className="flex gap-3 rounded-2xl border bg-background p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <p className="leading-7">{objective}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.introduction ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">💡 تمهيد الدرس</h2>
          <p className="mt-5 whitespace-pre-wrap text-lg leading-9">{lesson.introduction}</p>
        </section>
      ) : null}

      {lesson.explanation ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black">📖 شرح الدرس</h2>
            <Button type="button" variant="outline" disabled>
              🤖 اشرح لي — قريبًا
            </Button>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-lg leading-10">{lesson.explanation}</p>
        </section>
      ) : null}

      {lesson.vocabulary.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">📗 مفردات الدرس</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {lesson.vocabulary.map((item, index) => (
              <article key={`${item.word}-${index}`} className="rounded-2xl border bg-background p-5">
                <h3 className="text-xl font-black text-primary">{item.word || `مفردة ${index + 1}`}</h3>
                {item.meaning ? <p className="mt-3 leading-8"><strong>المعنى:</strong> {item.meaning}</p> : null}
                {item.example ? <p className="mt-2 leading-8 text-muted-foreground"><strong>مثال:</strong> {item.example}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.activities.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">🎮 أنشطة الدرس</h2>
          <div className="mt-5 space-y-4">
            {lesson.activities.map((activity, index) => (
              <article key={`${activity.title}-${index}`} className="rounded-2xl border bg-background p-5">
                <div className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-black">{activity.title || `النشاط ${index + 1}`}</h3>
                    <p className="mt-2 whitespace-pre-wrap leading-8 text-muted-foreground">{activity.instructions}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {lesson.assessment.length > 0 ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">❓ تقويم الدرس</h2>
          <p className="mt-2 text-muted-foreground">أجب عن الأسئلة ثم اضغط «تحقق من الإجابات».</p>

          <div className="mt-6 space-y-5">
            {lesson.assessment.map((item, index) => {
              const userAnswer = answers[index] ?? "";
              const isCorrect =
                isChecked &&
                Boolean(normalizeAnswer(userAnswer)) &&
                normalizeAnswer(userAnswer) === normalizeAnswer(item.answer);

              return (
                <div key={`${item.question}-${index}`} className="rounded-2xl border bg-background p-5">
                  <label htmlFor={`answer-${index}`} className="block font-bold leading-8">
                    {index + 1}. {item.question}
                  </label>
                  <input
                    id={`answer-${index}`}
                    value={userAnswer}
                    onChange={(event) => {
                      setAnswers((current) => ({ ...current, [index]: event.target.value }));
                      setIsChecked(false);
                    }}
                    className="mt-4 h-12 w-full rounded-xl border bg-background px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="اكتب إجابتك هنا"
                  />

                  {isChecked ? (
                    <div className={`mt-3 rounded-xl p-3 text-sm ${isCorrect ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>
                      {isCorrect ? "إجابة صحيحة ✓" : `الإجابة النموذجية: ${item.answer}`}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" onClick={() => setIsChecked(true)}>
              تحقق من الإجابات
            </Button>

            {isChecked ? (
              <div className="rounded-2xl border bg-background px-5 py-3 font-bold">
                النتيجة: {score} من {lesson.assessment.length} ({percentage}%)
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {lesson.homework ? (
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">📝 الواجب المنزلي</h2>
          <p className="mt-5 whitespace-pre-wrap text-lg leading-9">{lesson.homework}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border bg-primary/5 p-6 text-center shadow-sm sm:p-8">
        <div className="text-4xl">🏆</div>
        <h2 className="mt-3 text-2xl font-black">أحسنت! وصلت إلى نهاية الدرس</h2>
        <p className="mt-2 text-muted-foreground">
          زر إكمال الدرس وتسجيل النقاط في Supabase سيكون الخطوة التالية.
        </p>
        <Button type="button" className="mt-5" disabled>
          إكمال الدرس والحصول على {lesson.points} نقطة — قريبًا
        </Button>
      </section>
    </main>
  );
}