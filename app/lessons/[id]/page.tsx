import type { Metadata } from "next";
import Link from "next/link";
import InteractiveLessonActivities from "@/features/lessons/components/InteractiveLessonActivities";
import LessonSemanticSearch from "@/features/semantic-search/components/LessonSemanticSearch";
import LessonMasteryCard from "@/features/lesson-mastery/components/LessonMasteryCard";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_DESCRIPTION } from "@/lib/site";
import {
  getLessonPageBundle,
} from "@/features/lessons/queries/getLessonPageBundle";


import type { WeakQuestion } from "@/features/adaptive-learning/queries/getWeakQuestions";
import { evaluatePerformance } from "@/features/adaptive-learning/services/evaluatePerformance";
import AdaptiveRecommendationCard from "@/features/adaptive-learning/components/AdaptiveRecommendationCard";
import WeakQuestionsReview from "@/features/adaptive-learning/components/WeakQuestionsReview";

import LessonProgress from "@/components/lesson/LessonProgress";
import VocabularyCard from "@/components/lesson/VocabularyCard";
import MultipleChoiceQuestion from "@/components/lesson/MultipleChoiceQuestion";
import ScoreCard from "@/components/lesson/ScoreCard";

import LessonProgressCard from "@/features/student-progress/components/LessonProgressCard";
import StartLessonButton from "@/features/student-progress/components/StartLessonButton";
import LearningCompleteLessonButton from "@/features/student-progress/components/CompleteLessonButton";
import LessonTutor from "@/features/ai-tutor/components/LessonTutor";
import DadLessonContext from "@/components/dad-ai/DadLessonContext";

type LessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};


export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lessons")
    .select("title,summary")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return {
      title: "درس العربية",
      description: SITE_DESCRIPTION,
      robots: { index: false, follow: true },
    };
  }

  const title = data.title?.trim() || "درس العربية";
  const description =
    data.summary?.trim().slice(0, 170) ||
    `تعلّم ${title} في ضاديوم من خلال المحتوى والأنشطة والأسئلة التفاعلية.`;

  return {
    title,
    description,
    alternates: { canonical: `/lessons/${id}` },
    openGraph: {
      type: "article",
      url: `/lessons/${id}`,
      title,
      description,
    },
  };
}

type VocabularyItem = {
  word: string;
  meaning: string;
};

type QuestionOption = {
  id: string;
  text: string;
};

type LessonQuestion = {
  id: string;
  question_order: number;
  question: string;
  question_type: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation: string | null;
  points: number;
};


type LessonActivity = {
  id: string;
  lesson_id?: string;
  title: string;
  activity_type: string;
  instructions: string | null;
  content: Record<string, unknown>;
  activity_order: number;
  points: number;
  is_published?: boolean;
  section: string;
};
type LearningProgress = {
  id: string;
  status: string;
  progress_percent: number;
  best_score: number;
  last_score: number;
  xp: number;
  attempts: number;
  time_spent_seconds: number;
};

export default async function LessonPage({
  params,
}: LessonPageProps) {
  const { id } = await params;

  const bundle =
    await getLessonPageBundle(id);


  if (!bundle) {
    notFound();
  }

  const lesson =
    bundle.lesson;

  const lessonQuestions =
    bundle.questions;

  const lessonActivities: LessonActivity[] =
    Array.isArray(bundle.activities)
      ? (bundle.activities as LessonActivity[])
      : [];


  const user =
    bundle.student;

  const initialCompleted =
    bundle.completed;

        const learningProgress: LearningProgress | null =
    bundle.learningProgress as LearningProgress | null;

  const tutorMessages =
    bundle.tutorMessages;

  let adaptiveRecommendation:
    ReturnType<typeof evaluatePerformance> | null =
    null;

  let weakQuestions: WeakQuestion[] = [];

  if (user) {
    const attempts =
      bundle.questionAttempts ?? [];

    const totalQuestions =
      attempts.length;

    const correctAnswers =
      attempts.filter(
        (attempt) =>
          attempt.is_correct
      ).length;

    const score =
      totalQuestions > 0
        ? Math.round(
            (
              correctAnswers /
              totalQuestions
            ) * 100
          )
        : 0;

    adaptiveRecommendation =
      evaluatePerformance({
        score,
        attempts,
        currentLessonId:
          lesson.id,
        nextLessonId:
          lesson.nextLesson?.id ??
          null,
      });

    const weakQuestionIds =
      new Set(
        attempts
          .filter(
            (attempt) =>
              !attempt.is_correct
          )
          .map(
            (attempt) =>
              attempt.question_id
          )
      );

    weakQuestions =
      (
        lessonQuestions as WeakQuestion[]
      ).filter(
        (question) =>
          weakQuestionIds.has(
            question.id
          )
      );
  }
  const objectives: string[] =
    Array.isArray(lesson.learning_objectives)
      ? lesson.learning_objectives.filter(
          (item: unknown): item is string =>
            typeof item === "string"
        )
      : [];

  const vocabulary: VocabularyItem[] =
    Array.isArray(lesson.vocabulary)
      ? lesson.vocabulary.filter(
          (
            item: unknown
          ): item is VocabularyItem => {
            if (
              typeof item !== "object" ||
              item === null
            ) {
              return false;
            }

            const value =
              item as Partial<VocabularyItem>;

            return (
              typeof value.word === "string" &&
              typeof value.meaning === "string"
            );
          }
        )
      : [];

  const instructions: string[] =
    Array.isArray(lesson.instructions)
      ? lesson.instructions.filter(
          (item: unknown): item is string =>
            typeof item === "string"
        )
      : [];

  const questionsList: LessonQuestion[] =
    Array.isArray(lessonQuestions)
      ? (lessonQuestions as LessonQuestion[])
      : [];

  const multipleChoiceQuestions =
    questionsList.filter(
      (item) =>
        item.question_type ===
        "multiple_choice"
    );

  const multipleChoiceQuestionIds =
    new Set(
      multipleChoiceQuestions.map(
        (item) => item.id
      )
    );

  return (
    <main
      dir="rtl"
      className="lesson-arabic-shell min-h-screen px-4 py-8"
    >
      <DadLessonContext
        pageTitle={`درس: ${lesson.title}`}
        lessonTitle={lesson.title}
        lessonContent={lesson.content ?? ""}
      />
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/student"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            العودة إلى لوحة الطالب
          </Link>
        </div>

        <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>
              الدرس {lesson.lesson_number}
            </span>

            {lesson.estimated_minutes ? (
              <span>
                {lesson.estimated_minutes} دقيقة
              </span>
            ) : null}
          </div>

          <h1 className="font-arabic-display text-3xl font-black text-[#173f38] sm:text-4xl">
            {lesson.title}
          </h1>

          <LessonProgress
            progress={
              learningProgress?.progress_percent ??
              (initialCompleted ? 100 : 20)
            }
          />

          {lesson.summary ? (
            <p className="mt-4 leading-8 text-slate-600">
              {lesson.summary}
            </p>
          ) : null}
        </section>

        {user ? (
          <section className="lesson-arabic-card space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <LessonProgressCard
              progress={learningProgress}
            />

            {!learningProgress ? (
              <StartLessonButton
                lessonId={lesson.id}
                studentId={user.id}
              />
            ) : null}

            {learningProgress &&
            learningProgress.status !==
              "mastered" ? (
              <LearningCompleteLessonButton
                progressId={learningProgress.id}
                nextLessonId={
                  lesson.nextLesson?.id ??
                  null
                }
              />
            ) : null}
          </section>
        ) : (
          <section className="rounded-3xl bg-amber-50 p-6 text-center">
            <p className="font-semibold text-amber-900">
              سجّل الدخول لبدء الدرس وحفظ تقدمك.
            </p>
          </section>
        )}

        {objectives.length > 0 ? (
          <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-arabic-display text-2xl font-black text-[#173f38]">
              أهداف التعلم
            </h2>

            <ul className="space-y-3">
              {objectives.map(
                (
                  objective: string,
                  index: number
                ) => (
                  <li
                    key={`${objective}-${index}`}
                    className="rounded-2xl bg-emerald-50 px-4 py-3 leading-7 text-slate-700"
                  >
                    {objective}
                  </li>
                )
              )}
            </ul>
          </section>
        ) : null}

        <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-arabic-display text-2xl font-black text-[#173f38]">
            نص الدرس
          </h2>

          <div className="whitespace-pre-line font-arabic-reading text-xl leading-[2.15] text-[#3f3931]">
            {lesson.content}
          </div>
        </section>

        {vocabulary.length > 0 ? (
          <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-arabic-display text-2xl font-black text-[#173f38]">
              المفردات
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {vocabulary.map(
                (
                  item: VocabularyItem,
                  index: number
                ) => (
                  <VocabularyCard
                    key={`${item.word}-${index}`}
                    word={item.word}
                    meaning={item.meaning}
                  />
                )
              )}
            </div>
          </section>
        ) : null}

        {instructions.length > 0 ? (
          <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-arabic-display text-2xl font-black text-[#173f38]">
              أنشطة الدرس
            </h2>

            <ol className="space-y-3">
              {instructions.map(
                (
                  instruction: string,
                  index: number
                ) => (
                  <li
                    key={`${instruction}-${index}`}
                    className="rounded-2xl bg-amber-50 px-4 py-3 leading-7 text-slate-700"
                  >
                    <span className="ml-2 font-bold">
                      {index + 1}.
                    </span>

                    {instruction}
                  </li>
                )
              )}
            </ol>
          </section>
        ) : null}        {/* lesson-interactive-activities-marker */}

        {lessonActivities.length > 0 ? (
          <InteractiveLessonActivities
            activities={lessonActivities}
          />
        ) : null}



        <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">
            معلومات الدرس
          </h2>

          <div className="space-y-2 text-slate-600">
            <p>
              النوع: {lesson.lesson_type}
            </p>

            <p>
              رقم الدرس:{" "}
              {lesson.lesson_number}
            </p>

            <p>الحالة: {lesson.status}</p>

            <p>
              المدة:{" "}
              {lesson.estimated_minutes ?? 0}{" "}
              دقيقة
            </p>
          </div>
        </section>

        {lesson.source_pdf_url ? (
          <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
            <Link
              href={lesson.source_pdf_url}
              target="_blank"
              className="font-semibold text-emerald-700 hover:underline"
            >
              فتح صفحات الدرس في الكتاب الأصلي
            </Link>

            {lesson.source_page_start ? (
              <p className="mt-2 text-sm text-slate-500">
                صفحات المصدر:{" "}
                {lesson.source_page_start}

                {lesson.source_page_end &&
                lesson.source_page_end !==
                  lesson.source_page_start
                  ? `–${lesson.source_page_end}`
                  : ""}
              </p>
            ) : null}
          </section>
        ) : null}

        {multipleChoiceQuestions.length > 0 ? (
          <section className="space-y-6">
            {multipleChoiceQuestions.map(
              (item: LessonQuestion) => {
                return (
                  <div
                    key={item.id}
                    id={`question-${item.id}`}
                  >
                    <MultipleChoiceQuestion
                      lessonId={lesson.id}
                      questionId={item.id}
                      userId={user?.id ?? null}
                      question={item.question}
                      choices={item.options}
                      correctAnswer={
                        item.correct_answer
                      }
                      explanation={
                        item.explanation
                      }
                    />
                  </div>
                );
              }
            )}
          </section>
        ) : null}

        {user ? (
          <WeakQuestionsReview
            lessonId={lesson.id}
            questions={weakQuestions}
          />
        ) : null}

        {adaptiveRecommendation &&
        adaptiveRecommendation.score > 0 ? (
          <AdaptiveRecommendationCard
            recommendation={
              adaptiveRecommendation
            }
          />
        ) : null}

        {multipleChoiceQuestions.length > 0 ? (
          <ScoreCard
            score={
              bundle.questionAttempts.filter(
                (attempt) =>
                  attempt.is_correct &&
                  multipleChoiceQuestionIds.has(
                    attempt.question_id
                  )
              ).length
            }
            total={multipleChoiceQuestions.length}
          />
        ) : null}


        {user ? (
          <LessonTutor
            lessonId={lesson.id}
            initialMessages={tutorMessages.map(
              (message) => ({
                id: message.id,
                role: message.role,
                text: message.content,
              })
            )}
          />
        ) : null}

        <LessonSemanticSearch lessonId={lesson.id} />

        <LessonMasteryCard lessonId={lesson.id} />

        <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {lesson.previousLesson ? (
              <Link
                href={`/lessons/${lesson.previousLesson.id}`}
                className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
              >
                ←{" "}
                {lesson.previousLesson.title}
              </Link>
            ) : (
              <div />
            )}

            {lesson.nextLesson ? (
              <Link
                href={`/lessons/${lesson.nextLesson.id}`}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                {lesson.nextLesson.title} →
              </Link>
            ) : (
              <div className="rounded-xl bg-emerald-50 px-5 py-3 font-semibold text-emerald-700">
                آخر درس في الوحدة
              </div>
            )}
          </div>
        </section>
      </div>

<section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">

<h2 className="text-2xl font-bold">
جاهز لاختبار نفسك؟
</h2>

<p className="mt-2 text-slate-600">
بعد الانتهاء من الدرس يمكنك بدء الاختبار الذكي.
</p>

<Link
href={`/assessment/${lesson.id}`}
className="mt-5 inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
>
ابدأ الاختبار الذكي
</Link>

</section>

</main>
  );
}
