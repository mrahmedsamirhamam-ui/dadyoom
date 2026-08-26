import {
  redirect,
} from "next/navigation";

type AssessmentPageProps = {
  searchParams: Promise<{
    lessonId?: string;
  }>;
};

export default async function AssessmentPage({
  searchParams,
}: AssessmentPageProps) {
  const { lessonId } =
    await searchParams;

  const normalizedLessonId =
    lessonId?.trim();

  if (normalizedLessonId) {
    redirect(
      `/assessment/${encodeURIComponent(
        normalizedLessonId
      )}`
    );
  }

  redirect("/courses");
}
