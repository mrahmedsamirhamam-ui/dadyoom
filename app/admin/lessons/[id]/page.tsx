import {
  notFound,
} from "next/navigation";

import Link from "next/link";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  Button,
} from "@/components/ui/button";

import AutoBuildLessonButton
  from "./auto-build-lesson-button";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LessonRow = {
  id: string;
  unit_id: string;
  title: string;
  slug: string | null;
  lesson_number: number;
  sort_order: number | null;
  lesson_type: string;
  summary: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
  status: string;
  is_free: boolean | null;
  estimated_minutes: number | null;
};

export default async function LessonPage({
  params,
}: PageProps) {
  const {
    id,
  } =
    await params;

  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "lessons"
      )
      .select(`
        id,
        unit_id,
        title,
        slug,
        lesson_number,
        sort_order,
        lesson_type,
        summary,
        source_page_start,
        source_page_end,
        status,
        is_free,
        estimated_minutes
      `)
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (
    error
  ) {
    console.error(
      "ADMIN_LESSON_FETCH_ERROR:",
      {
        message:
          error.message,
        code:
          error.code,
        details:
          error.details,
        id,
      }
    );

    throw new Error(
      "تعذر تحميل بيانات الدرس."
    );
  }

  if (!data) {
    notFound();
  }

  const lesson =
    data as LessonRow;

  const paddedLessonNumber =
    String(
      lesson.lesson_number
    ).padStart(
      2,
      "0"
    );

  /*
   * Current Bahrain Grade 1 curriculum path.
   * Later this can come directly from curriculum metadata.
   */
  const imageBaseUrl =
    `/curriculum/bahrain/grade-01/lesson-${paddedLessonNumber}`;

  return (
    <main
      className="space-y-6"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-muted-foreground">
            الدرس رقم{" "}
            {lesson.lesson_number}
          </p>

          <h1 className="mt-1 text-3xl font-black">
            {lesson.title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>
              النوع:{" "}
              {lesson.lesson_type}
            </span>

            <span>
              •
            </span>

            <span>
              الحالة:{" "}
              {lesson.status}
            </span>

            <span>
              •
            </span>

            <span>
              الصفحات:{" "}
              {lesson.source_page_start ??
                "—"}
              {" — "}
              {lesson.source_page_end ??
                "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            render={
              <Link href="/admin/lessons" />
            }
          >
            العودة إلى الدروس
          </Button>

          <Button
            variant="outline"
            render={
              <Link
                href={`/lessons/${lesson.id}`}
              />
            }
          >
            فتح نسخة الطالب
          </Button>
        </div>
      </div>

      {lesson.summary ? (
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-black">
            ملخص الدرس
          </h2>

          <p className="mt-2 leading-8 text-muted-foreground">
            {lesson.summary}
          </p>
        </section>
      ) : null}

      <AutoBuildLessonButton
        lessonId={
          lesson.id
        }
        imageBaseUrl={
          imageBaseUrl
        }
        sourcePageStart={
          lesson.source_page_start ?? 0
        }
        sourcePageEnd={
          lesson.source_page_end ?? 0
        }
      />

      <section className="rounded-2xl border bg-card p-5 text-sm shadow-sm">
        <h2 className="font-black">
          بيانات المصدر
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">
              بداية الصفحات:
            </span>{" "}
            <strong>
              {lesson.source_page_start ??
                "—"}
            </strong>
          </div>

          <div>
            <span className="text-muted-foreground">
              نهاية الصفحات:
            </span>{" "}
            <strong>
              {lesson.source_page_end ??
                "—"}
            </strong>
          </div>

          <div>
            <span className="text-muted-foreground">
              مسار الصور:
            </span>{" "}
            <code
              className="break-all"
              dir="ltr"
            >
              {imageBaseUrl}
            </code>
          </div>

          <div>
            <span className="text-muted-foreground">
              Lesson ID:
            </span>{" "}
            <code
              className="break-all"
              dir="ltr"
            >
              {lesson.id}
            </code>
          </div>
        </div>
      </section>
    </main>
  );
}
