import type { Metadata } from "next";
import Link from "next/link";
import InteractiveLessonActivities from "@/features/lessons/components/InteractiveLessonActivities";
import LessonPracticeWorkspace from "@/features/lessons/components/LessonPracticeWorkspace";
import LessonSemanticSearch from "@/features/semantic-search/components/LessonSemanticSearch";
import LessonMasteryCard from "@/features/lesson-mastery/components/LessonMasteryCard";
import { notFound, redirect } from "next/navigation";
import { isKnownBookReferenceId } from "@/lib/curriculum/verified-book-reference";
import { createClient } from "@/lib/supabase/server";
import { SITE_DESCRIPTION } from "@/lib/site";
import { normalizeArabicDisplayText } from "@/lib/seo/normalize-arabic-display";
import { describeLessonSourceReference } from "@/lib/curriculum/lesson-source-reference";
import { lessonNeedsSourceReview } from "@/lib/curriculum/lesson-source-review";
import { isCurriculumScopeRecord, isEmptyLessonReference } from "@/lib/curriculum/lesson-content-kind";
import {
  getLessonPageBundle,
} from "@/features/lessons/queries/getLessonPageBundle";


import type { WeakQuestion } from "@/features/adaptive-learning/queries/getWeakQuestions";
import { evaluatePerformance } from "@/features/adaptive-learning/services/evaluatePerformance";
import AdaptiveRecommendationCard from "@/features/adaptive-learning/components/AdaptiveRecommendationCard";
import WeakQuestionsReview from "@/features/adaptive-learning/components/WeakQuestionsReview";

import LessonProgress from "@/components/lesson/LessonProgress";
import LessonPageJourneyNav from "@/components/lesson/LessonPageJourneyNav";
import SmartQrCard from "@/components/lesson/SmartQrCard";
import LessonLearningSlides from "@/components/lesson/LessonLearningSlides";
import StructuredLessonText from "@/components/lesson/StructuredLessonText";
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
  if (isKnownBookReferenceId(id)) {
    return {
      title: "مرجع كتاب — فهرس الدروس قيد التحقق | ضاديوم",
      robots: { index: false, follow: true },
      alternates: { canonical: `/curriculum/books/${id}` },
    };
  }
  const supabase = await createClient();

  const {
    data: seoLesson,
    error: seoError,
  } = await supabase
    .from("seo_indexable_lessons_fast")
    .select("title,summary,country_name,grade_name,unit_title")
    .eq("id", id)
    .maybeSingle();

  if (!seoError && seoLesson) {
    const title =
      normalizeArabicDisplayText(
        seoLesson.title,
      ) ||
      "درس العربية";

    const context =
      [
        seoLesson.country_name,
        seoLesson.grade_name,
      ]
        .filter(Boolean)
        .join("، ");

    const seoTitle =
      context
        ? `${title} – ${context}`
        : title;

    const baseDescription =
      seoLesson.summary?.trim() ||
      `تعلّم ${title} في ضاديوم من خلال المحتوى والأنشطة والأسئلة التفاعلية.`;

    // Some imported summaries are only a few words. A concise,
    // descriptive fallback helps searchers understand the lesson.
    const enrichedDescription =
      baseDescription.length < 105
        ? `${baseDescription} شرح وتدريبات لغة عربية لدرس ${title}${context ? ` في ${context}` : ""}، مع أنشطة فهم ومراجعة من ضاديوم.`
        : context
          ? `${baseDescription} — ${context}.`
          : baseDescription;

    const description =
      enrichedDescription.slice(0, 155);

    return {
      title: seoTitle,
      description,
      alternates: {
        canonical:
          `/lessons/${id}`,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        type: "article",
        url: `/lessons/${id}`,
        title: seoTitle,
        description,
      },
    };
  }

  if (seoError) {
    console.error(
      "SEO_LESSON_INDEXABILITY_LOOKUP_FAILED",
      {
        id,
        message:
          seoError.message,
      },
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("lessons")
    .select("title,summary")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return {
      title: "درس العربية",
      description:
        SITE_DESCRIPTION,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    normalizeArabicDisplayText(
      data.title,
    ) ||
    "درس العربية";

  const description =
    data.summary?.trim().slice(
      0,
      170,
    ) ||
    `تعلّم ${title} في ضاديوم من خلال المحتوى والأنشطة والأسئلة التفاعلية.`;

  return {
    title,
    description,
    alternates: {
      canonical:
        `/lessons/${id}`,
    },
    robots: {
      index: false,
      follow: false,
    },
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

  // These legacy IDs refer to textbook titles, not assessable lessons.
  // Redirect before loading the lesson bundle, tutor, mastery or XP widgets.
  if (isKnownBookReferenceId(id)) {
    redirect(`/curriculum/books/${id}`);
  }

  const bundle =
    await getLessonPageBundle(id);


  if (!bundle) {
    notFound();
  }

  const lesson =
    bundle.lesson;

  // A national domain / outcome coverage node is not an assessable lesson.
  // Show an honest navigation page, never mastery, XP or false lesson progress.
  const curriculumScope = isCurriculumScopeRecord({
    summary: lesson.summary,
    content: lesson.content,
  });
  const emptyReference = isEmptyLessonReference(lesson.content);
  if (curriculumScope || emptyReference) {
    const title = normalizeArabicDisplayText(lesson.title);
    // Follow the real FK chain; never infer a grade from a title, OCR or user agent.
    // If the relation cannot be resolved, the unfiltered catalog remains safe.
    const supabase = await createClient();
    const { data: scopeUnit } = await supabase
      .from("units")
      .select("grades!inner(grade_number,curricula!inner(countries!inner(code)))")
      .eq("id", lesson.unit_id)
      .maybeSingle();
    type Linked<T> = T | T[] | null | undefined;
    const first = <T,>(value: Linked<T>): T | null =>
      Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    type LinkedCountry = { code: string };
    type LinkedCurriculum = { countries: Linked<LinkedCountry> };
    type LinkedGrade = { grade_number: number | null; curricula: Linked<LinkedCurriculum> };
    const linked = scopeUnit as unknown as { grades?: Linked<LinkedGrade> } | null;
    const linkedGrade = first(linked?.grades);
    const linkedCountry = first(first(linkedGrade?.curricula)?.countries);
    const code = linkedCountry?.code?.toUpperCase() ?? "";
    const grade = Number(linkedGrade?.grade_number ?? 0);
    const scoped = /^[A-Z]{2}$/.test(code) && Number.isInteger(grade) && grade >= 1 && grade <= 13;
    const catalogLink = scoped ? `/courses?country=${code}&grade=${grade}` : "/courses";
    const searchLink = scoped ? `/search?country=${code}&grade=${grade}` : "/search";
    return (
      <main dir="rtl" className="min-h-screen bg-[#f8f4eb] px-4 py-10 text-[#173f38]">
        <div className="mx-auto max-w-4xl space-y-6">
          <nav aria-label="مسار العودة" className="flex flex-wrap gap-4 text-sm font-black">
            <Link href="/curriculum" className="underline">دليل الدول والمناهج</Link>
            <Link href="/courses" className="underline">كل دروس الصفوف</Link>
          </nav>
          <section className="rounded-[2rem] border border-[#dac8a6] bg-white p-6 sm:p-9">
            <p className="font-black text-[#93661e]">
              {curriculumScope ? "مجال من المنهج — ليس درسًا مستقلًا" : "مرجع تعليمي — النص غير متاح بعد"}
            </p>
            <h1 className="mt-3 text-3xl font-black leading-relaxed">{title}</h1>
            <p className="mt-4 text-base leading-9">
              {curriculumScope
                ? "هذه صفحة لتنظيم مجال تعليمي أو مجموعة نواتج تعلم، وليست شرحًا كاملًا لدرس واحد من الكتاب الوزاري. لا تُحتسب درجة أو نقاط إتقان من مجرد فتحها."
                : "السجل الحالي لا يتضمن نصًا تعليميًا يمكن شرحه أو التدرب عليه بأمان. يلزم استكمال مادته من مصدره الصحيح قبل عرضه كدرس."}
            </p>
            {lesson.summary ? (
              <p className="mt-4 rounded-xl bg-[#f2ecdf] p-4 text-sm leading-8">{lesson.summary}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={catalogLink} className="inline-flex min-h-12 items-center rounded-full bg-[#173f38] px-6 py-3 font-black text-white">
                اختر الدولة والصف لعرض الدروس المتاحة ←
              </Link>
              <Link href={searchLink} className="inline-flex min-h-12 items-center rounded-full border border-[#b9a276] px-5 py-3 font-black text-[#173f38]">
                🔍 ابحث عن عنوان درس محدد
              </Link>
            </div>
          </section>
          {lesson.source_pdf_url ? (
            <section className="rounded-2xl border border-[#dfd0b5] bg-white p-5 text-sm leading-8">
              <h2 className="text-lg font-black">مرجع النطاق أو الكتاب</h2>
              <p>وجود رابط المصدر لا يعني أن جميع دروس الكتاب قد استُخرجت أو طابقت فهرسه.</p>
              <a href={lesson.source_pdf_url} target="_blank" rel="noopener noreferrer"
                className="font-black text-[#176455] underline">افتح المرجع المسجل ↗</a>
            </section>
          ) : null}
        </div>
      </main>
    );
  }

  const sourceReviewRequired = lessonNeedsSourceReview(lesson.content);
  // An actual instructional body is required for guided practice.
  // Book-identity cards and short reference placeholders are not complete
  // lessons and must not be disguised as such by the shared worksheet.
  const lessonBody = (lesson.content ?? "").trim();
  const referenceOnly = /هذا عنصر من كتاب|هوية الدرس|بطاقة مرجعية|مرجع الكتاب فقط|book reference|لم تُرفع صفحة الكتاب/iu.test(lessonBody);
  const practiceAvailable = lesson.status === "published" &&
    lessonBody.length >= 250 && !referenceOnly;
  // The shared Dadyoom core is enrichment, not a ministry textbook.
  // All 22 countries have original lessons explicitly marked in the content.
  const isOriginalDadyoomLesson =
    ["درس ضاديوم الأصلي:", "حزمة ضاديوم الموضوعية المتخصصة", "مسار الإتقان الأصلي — ضاديوم", "مسار القراءة والفهم الأصلي — ضاديوم", "مسار التعبير والكتابة الأصلي — ضاديوم"]
      .some((prefix) => (lesson.content ?? "").trimStart().startsWith(prefix));
  // Lack of a recorded textbook link must never be presented as
  // verified official content, even if the lesson title looks official.
  const missingTextbookSource =
    !isOriginalDadyoomLesson && !lesson.source_pdf_url?.trim();

  const sourceReference = lesson.source_pdf_url
    ? describeLessonSourceReference(lesson.source_pdf_url)
    : null;

  const lessonDisplayTitle =
    normalizeArabicDisplayText(
      lesson.title,
    ) ||
    "درس العربية";

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
    // DADYOOM_ACTIVITY_AWARE_ADAPTIVE_V2
    const questionAttempts =
      bundle.questionAttempts ?? [];

    const activityAttempts =
      bundle.activityAttempts ?? [];

    const attemptedActivityIds =
      new Set(
        activityAttempts.map(
          (attempt) =>
            attempt.activity_id
        )
      );

    const attempts: Array<{
      question_id: string;
      is_correct: boolean;
    }> =
      questionAttempts.length > 0
        ? questionAttempts
        : lessonActivities.map(
            (activity) => ({
              question_id:
                activity.id,
              is_correct:
                attemptedActivityIds.has(
                  activity.id
                ),
            })
          );

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
        questionAttempts
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
      ? lesson.learning_objectives
          .filter(
            (item: unknown): item is string =>
              typeof item === "string",
          )
          .map(
            (objective) =>
              normalizeArabicDisplayText(
                objective,
              ),
          )
          .filter(Boolean)
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
      className="lesson-arabic-shell min-h-screen bg-[#f7f2e8] px-4 py-6 sm:py-10"
    >
      <DadLessonContext
        pageTitle={`درس: ${lessonDisplayTitle}`}
        lessonTitle={lessonDisplayTitle}
        lessonContent={lesson.content ?? ""}
      />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/courses" className="text-sm font-black text-[#174f47] underline">← مستكشف الدروس</Link>
          <Link href="/search" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d7c49d] bg-white px-4 py-2 text-sm font-black text-[#123f39]">
            <span aria-hidden="true">🔍</span> ابحث عن درس آخر
          </Link>
        </div>
        <LessonPageJourneyNav variant="mobile" hasObjectives={objectives.length > 0}
          hasVocabulary={vocabulary.length > 0}
          hasSource={Boolean(lesson.source_pdf_url && sourceReference)}
          hasTutor={Boolean(user)}/>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <div className="min-w-0 space-y-6">
        <section id="lesson-overview" aria-labelledby="lesson-title"
          className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-[#d7c29a] bg-gradient-to-br from-[#fff5df] via-white to-[#e8f4ec] p-6 shadow-sm sm:p-9">
          <p className="mb-5 inline-flex rounded-full border border-[#cfb36f] bg-white/80 px-4 py-2 text-xs font-black text-[#816020]">
            ✦ اللغة العربية أسهل في ضاديوم
          </p>
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

          <h1 id="lesson-title" className="font-arabic-display text-3xl font-black leading-relaxed text-[#173f38] sm:text-4xl">
            {lessonDisplayTitle}
          </h1>

          <p className="mt-3 max-w-3xl font-arabic-reading text-base leading-8 text-[#54685c]">
            افهم الشرح، ثم جرّب بنفسك، وبعدها اختبر فهمك. يمكنك قراءة الدرس دون تسجيل، وحفظ التقدم يحتاج إلى حساب.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#lesson-explanation" className="inline-flex min-h-12 items-center rounded-full bg-[#123f39] px-6 py-3 font-black text-white">
              ابدأ شرح الدرس ←
            </a>
            <a href="#lesson-practice" className="inline-flex min-h-12 items-center rounded-full border border-[#bba372] bg-white px-6 py-3 font-black text-[#123f39]">
              جرّب بنفسك
            </a>
          </div>
          {isOriginalDadyoomLesson ? (
            <aside role="note" data-lesson-source-kind="dadyoom-original"
              className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-7 text-sky-950">
              <strong>محتوى إثرائي أصلي من ضاديوم:</strong> هذا الدرس من المسار المهاري
              الذي طورته ضاديوم، وليس نصًا منقولًا من كتاب وزارة التربية والتعليم.
              لا يُعد ظهوره في دولة أو صف إثباتًا لمطابقته للمنهج الرسمي لذلك البلد.
            </aside>
          ) : null}

          {missingTextbookSource ? (
            <aside role="note" data-lesson-source-kind="pending-documentation"
              className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              <strong>المصدر الرسمي قيد التحقق:</strong> لا يوجد رابط مباشر لمرجع الكتاب
              في سجل هذا الدرس حاليًا. لا تعتبر عنوانه أو شرحه مطابقًا لنص
              الكتاب الوزاري حتى تُراجع الطبعة والصفحات لدى مصدر رسمي.
            </aside>
          ) : null}

          {sourceReviewRequired ? (
            <aside role="note" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950">
              <strong>تنبيه توثيق المحتوى:</strong> يتضمن هذا الدرس شرحًا إثرائيًا أو استخراجًا أوليًا
              يحتاج إلى مطابقة بعنوان ونص الكتاب الرسمي. راجع معلمك أو مرجع الدرس
              قبل الاعتماد عليه بوصفه نصًا من الكتاب المدرسي.
            </aside>
          ) : null}

          <LessonProgress
            progress={
              learningProgress?.progress_percent ??
              (initialCompleted ? 100 : 0)
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
          <section id="lesson-objectives" className="lesson-arabic-card scroll-mt-28 rounded-3xl border border-[#e3d3b7] bg-white p-6 shadow-sm">
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

        <section id="lesson-explanation" aria-label="شرح الدرس" className="scroll-mt-28 space-y-4">
          <div className="rounded-2xl bg-[#123f39] p-5 text-white">
            <p className="text-xs font-bold text-[#ecd69e]">المرحلة الأولى</p>
            <h2 className="font-arabic-display text-2xl font-black">افهم الدرس</h2>
          </div>
        <LessonLearningSlides
          title={lessonDisplayTitle}
          summary={lesson.summary}
          content={lesson.content}
          objectives={objectives}
          vocabulary={vocabulary}
          instructions={lesson.instructions}
        />
        {practiceAvailable ? (
          <div className="mt-5">
            <StructuredLessonText content={lesson.content} />
          </div>
        ) : null}
        </section>
        <section id="lesson-practice" aria-label="تطبيق الدرس" className="scroll-mt-28 space-y-4">
          <div className="rounded-2xl border border-[#c8dccd] bg-[#eaf4ec] p-5">
            <p className="text-xs font-bold text-[#34604e]">المرحلة الثانية</p>
            <h2 className="font-arabic-display text-2xl font-black text-[#123f39]">جرّب بنفسك</h2>
          </div>
        {practiceAvailable ? (
          <LessonPracticeWorkspace
            title={lessonDisplayTitle}
            lessonType={lesson.lesson_type}
            objective={objectives[0]}
          />
        ) : (
          <section role="note" className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-8 text-amber-950">
            <h2 className="text-lg font-black">هذا الدرس يحتاج مادة تعليمية إضافية</h2>
            <p className="mt-2">
              المعروض حاليًا مرجع مختصر أو مادة لم يكتمل نصها. لا نعرض تدريبًا يوهم بأن
              نص الكتاب الرسمي كامل. يمكنك الرجوع إلى المعلم أو مصدر الكتاب حتى يُستكمل الدرس.
            </p>
          </section>
        )}
        </section>
        <section id="lesson-assessment" className="scroll-mt-28 rounded-3xl border border-[#decda5] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black text-amber-700">
            بعد انتهاء العرض
          </p>
          <h2 className="mt-1 text-3xl font-black text-slate-950">
            اختبر نفسك
          </h2>
          <p className="mt-2 text-slate-600">
            أجب عن الأسئلة التالية لتتأكد من فهم الدرس.
          </p>
        </section>

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
{vocabulary.length > 0 ? (
          <section id="lesson-vocabulary" className="lesson-arabic-card scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm">
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

        {lesson.source_pdf_url && sourceReference ? (
          <section id="lesson-source" className="lesson-arabic-card scroll-mt-28 rounded-3xl bg-white p-6 shadow-sm" aria-label="مصدر الدرس وحالة التوثيق">
            <h2 className="mb-3 text-xl font-black text-[#173f38]">مصدر الدرس</h2>
            <a
              href={lesson.source_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-emerald-700 underline hover:text-emerald-900"
            >
              {sourceReference.linkLabel} ↗
            </a>

            <p className={sourceReference.caution
              ? "mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold leading-7 text-amber-900"
              : "mt-3 text-sm leading-7 text-slate-600"}>
              {sourceReference.detail}
            </p>

            {lesson.source_page_start ? (
              <p className="mt-2 text-sm text-slate-500">
                الصفحات المسجلة في مرجع المصدر:{" "}
                {lesson.source_page_start}
                {lesson.source_page_end &&
                 lesson.source_page_end !== lesson.source_page_start
                  ? `–${lesson.source_page_end}`
                  : ""}
              </p>
            ) : null}
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


        <section id="lesson-assistant" aria-label="مساعد الدرس" className="scroll-mt-28 space-y-5">
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
        </section>

        <section id="lesson-extras" aria-labelledby="lesson-extras-title" className="scroll-mt-28 space-y-4">
          <div className="rounded-2xl border border-[#dfcda7] bg-[#fff4dc] p-5">
            <p className="text-xs font-black text-[#8b6721]">تعلّم أكثر</p>
            <h2 id="lesson-extras-title" className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">أدوات إضافية للدرس</h2>
            <p className="mt-2 text-sm leading-7 text-[#675e4d]">الألعاب والاستوديو والفيديو مكملات اختيارية بعد شرح الدرس وتدريباته.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
        <section className="lesson-arabic-card rounded-3xl border border-[#d7bd83] bg-[#fff7e3] p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black text-[#9f7426]">العب وتعلّم</div>
              <h2 className="mt-1 font-arabic-display text-xl font-black text-[#173f38]">
                ألعاب عربية من نفس الدرس
              </h2>
            </div>
            <Link
              href={`/lessons/${lesson.id}/games`}
              rel="nofollow"
              className="dadyoom-arabic-button rounded-2xl px-5 py-3 text-center font-black text-white"
            >
              افتح الألعاب
            </Link>
          </div>
        </section>
        <section className="lesson-arabic-card rounded-3xl border border-[#dcc899] bg-[#fffaf0] p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black text-[#a16f18]">
                استوديو الدرس الذكي
              </div>
              <h2 className="mt-1 font-arabic-display text-xl font-black text-[#173f38]">
                ملخص • PowerPoint • دفتري • فيديو AI قريبًا
              </h2>
            </div>
            <Link
              href={`/lessons/${lesson.id}/study`}
              rel="nofollow"
              className="rounded-2xl bg-[#173f38] px-5 py-3 text-center font-black text-white"
            >
              افتح استوديو الدرس
            </Link>
          </div>
        </section>
        {/* DADYOOM_LESSON_VIDEO_BUTTON_V1 */}
        <section className="lesson-arabic-card rounded-3xl border border-[#d7bd83] bg-[#fff7e3] p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black text-[#9f7426]">
                شاهد وتعلّم
              </div>
              <h2 className="mt-1 font-arabic-display text-xl font-black text-[#173f38]">
                فيديو شرح الدرس
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                مصدر رسمي من الدولة أولًا، ثم شرح من نفس الدولة أو المنهج، ثم فيديو كرتوني تعليمي مناسب.
              </p>
            </div>
            <Link
              href={`/lessons/${lesson.id}/video`}
              rel="nofollow"
              className="rounded-2xl bg-[#b5842b] px-5 py-3 text-center font-black text-white"
            >
              شاهد الفيديو
            </Link>
          </div>
        </section>

        {lesson.status === "published" ? (
          <SmartQrCard
            lessonId={lesson.id}
            lessonTitle={lessonDisplayTitle}
          />
        ) : null}

        <div>
          <Link
            href="/student"
              rel="nofollow"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            العودة إلى لوحة الطالب
          </Link>
        </div>
          </div>
        </section>

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
          <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="خريطة تنقل الدرس">
            <LessonPageJourneyNav variant="desktop" hasObjectives={objectives.length > 0}
          hasVocabulary={vocabulary.length > 0}
          hasSource={Boolean(lesson.source_pdf_url && sourceReference)}
          hasTutor={Boolean(user)}/>
          </aside>
        </div>
      </div>

<section id="lesson-final-quiz" className="mx-auto mt-8 max-w-7xl scroll-mt-28 rounded-3xl border border-[#e3d4b8] bg-white p-6 shadow-sm">

<h2 className="text-2xl font-bold">
جاهز لاختبار نفسك؟
</h2>

<p className="mt-2 text-slate-600">
بعد الانتهاء من الدرس يمكنك بدء الاختبار الذكي.
</p>

<Link
href={`/assessment/${lesson.id}`}
              rel="nofollow"
className="mt-5 inline-flex rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
>
ابدأ الاختبار الذكي
</Link>

</section>

</main>
  );
}