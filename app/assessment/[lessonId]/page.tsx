import Link from "next/link";

import LessonAssessment from "@/features/assessment/components/LessonAssessment";
import { getLessonById } from "@/features/lessons/queries/getLessonById";

type AssessmentPageProps = {
  params: Promise<{
    lessonId: string;
  }>;
};

export default async function AssessmentPage({
  params,
}: AssessmentPageProps) {
  const { lessonId } = await params;

  const lesson =
    await getLessonById(
      lessonId
    );

  const nextLessonId =
    lesson?.nextLesson?.id ??
    null;

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-5xl space-y-6 p-8"
    >
      <LessonAssessment
        lessonId={lessonId}
        nextLessonId={
          nextLessonId
        }
      />

      <Link
        href={`/lessons/${lessonId}`}
        className="inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
      >
        العودة إلى الدرس
      </Link>
    </main>
  );
}
