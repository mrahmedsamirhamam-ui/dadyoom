import Link from "next/link";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  Button,
} from "@/components/ui/button";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Lesson = {
  id: string;
  title: string;
  slug: string | null;
  lesson_number: number;
  lesson_type: string;
  estimated_minutes: number | null;
  status: string;
  source_page_start: number | null;
  source_page_end: number | null;

  units:
    | {
        title: string;
        unit_number: number | null;

        grades:
          | {
              name_ar: string;
              grade_number: number | null;
            }
          | {
              name_ar: string;
              grade_number: number | null;
            }[]
          | null;
      }
    | {
        title: string;
        unit_number: number | null;

        grades:
          | {
              name_ar: string;
              grade_number: number | null;
            }
          | {
              name_ar: string;
              grade_number: number | null;
            }[]
          | null;
      }[]
    | null;
};

function getRelation<T>(
  relation:
    | T
    | T[]
    | null
): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(
    relation
  )
    ? relation[0] ?? null
    : relation;
}

function getLessonTypeName(
  type: string
) {
  const names: Record<
    string,
    string
  > = {
    reading: "قراءة",
    writing: "كتابة",
    listening: "استماع",
    speaking: "تحدث",
    grammar: "قواعد",
    vocabulary: "مفردات",
  };

  return names[type] ?? type;
}

function getStatusName(
  status: string
) {
  const names: Record<
    string,
    string
  > = {
    draft: "مسودة",
    published: "منشور",
    archived: "مؤرشف",
  };

  return names[status] ?? status;
}

export default async function AdminLessonsPage() {
  const supabase =
    await createClient();

  const [
    lessonsResult,
    publishedResult,
    draftResult,
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select(
        `
          id,
          title,
          slug,
          lesson_number,
          lesson_type,
          estimated_minutes,
          status,
          source_page_start,
          source_page_end,
          units (
            title,
            unit_number,
            grades (
              name_ar,
              grade_number
            )
          )
        `,
        { count: "estimated" },
      )
      .order("lesson_number", { ascending: true })
      .limit(100),

    supabase
      .from("lessons")
      .select("id", { count: "estimated", head: true })
      .eq("status", "published"),

    supabase
      .from("lessons")
      .select("id", { count: "estimated", head: true })
      .eq("status", "draft"),
  ]);

  const {
    data,
    error,
    count: totalLessonCount,
  } = lessonsResult;

  if (error) {
    console.error(
      "ADMIN_LESSONS_FETCH_ERROR:",
      {
        message:
          error.message,
        code:
          error.code,
        details:
          error.details,
      }
    );

    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold text-destructive">
          تعذر تحميل الدروس
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {error.message}
        </p>
      </div>
    );
  }

  if (publishedResult.error) {
    console.error(
      "ADMIN_LESSONS_PUBLISHED_COUNT_ERROR:",
      publishedResult.error.message,
    );
  }

  if (draftResult.error) {
    console.error(
      "ADMIN_LESSONS_DRAFT_COUNT_ERROR:",
      draftResult.error.message,
    );
  }

  const lessons =
    (data ?? []) as Lesson[];

  const publishedCount =
    publishedResult.count ?? 0;

  const draftCount =
    draftResult.count ?? 0;

  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            إدارة الدروس
          </h1>

          <p className="mt-1 text-muted-foreground">
            راجع الدروس المنشورة وأثرِ محتواها؛ المنهج الأساسي يأتي من حزم المناهج الموثقة.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/curriculum"
            prefetch={false}
            className="rounded-full border border-[#d3c099] bg-[#fffaf0] px-5 py-2.5 text-sm font-black text-[#6f572d]"
          >
            بوابة المناهج
          </Link>

          <Link
            href="/courses"
            prefetch={false}
            className="rounded-full bg-[#123f39] px-5 py-2.5 text-sm font-black text-white"
          >
            معاينة المنشور
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            إجمالي الدروس
          </p>

          <p className="mt-2 text-3xl font-bold">
            {totalLessonCount ?? lessons.length}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            الدروس المنشورة
          </p>

          <p className="mt-2 text-3xl font-bold">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            المسودات
          </p>

          <p className="mt-2 text-3xl font-bold">
            {draftCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3 text-xs font-bold text-muted-foreground">
          عرض أول {lessons.length} درسًا فقط للحفاظ على سرعة لوحة الإدارة.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">
                مسلسل
              </TableHead>

              <TableHead className="text-right">
                رقم الدرس
              </TableHead>

              <TableHead className="text-right">
                عنوان الدرس
              </TableHead>

              <TableHead className="text-right">
                الوحدة
              </TableHead>

              <TableHead className="text-right">
                الصف
              </TableHead>

              <TableHead className="text-right">
                النوع
              </TableHead>

              <TableHead className="text-right">
                الصفحات
              </TableHead>

              <TableHead className="text-right">
                المدة
              </TableHead>

              <TableHead className="text-right">
                الحالة
              </TableHead>

              <TableHead className="text-right">
                الإدارة
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {lessons.length ===
            0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-muted-foreground"
                >
                  لا توجد دروس حتى الآن.
                </TableCell>
              </TableRow>
            ) : (
              lessons.map(
                (
                  lesson,
                  index
                ) => {
                  const unit =
                    getRelation(
                      lesson.units
                    );

                  const grade =
                    getRelation(
                      unit?.grades ??
                        null
                    );

                  const pages =
                    lesson.source_page_start &&
                    lesson.source_page_end
                      ? `${lesson.source_page_start} — ${lesson.source_page_end}`
                      : "—";

                  return (
                    <TableRow
                      key={
                        lesson.id
                      }
                    >
                      <TableCell className="font-bold">
                        {index + 1}
                      </TableCell>

                      <TableCell className="font-bold">
                        {lesson.lesson_number}
                      </TableCell>

                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/lessons/${lesson.id}`}
                          prefetch={false}
                          className="hover:underline"
                        >
                          {lesson.title}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {unit?.title ??
                          "غير محددة"}
                      </TableCell>

                      <TableCell>
                        {grade?.name_ar ??
                          "غير محدد"}
                      </TableCell>

                      <TableCell>
                        {getLessonTypeName(
                          lesson.lesson_type
                        )}
                      </TableCell>

                      <TableCell>
                        {pages}
                      </TableCell>

                      <TableCell>
                        {lesson.estimated_minutes
                          ? `${lesson.estimated_minutes} دقيقة`
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {lesson.status ===
                        "published" ? (
                          <Badge>
                            منشور
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {getStatusName(
                              lesson.status
                            )}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          render={
                            <Link
                              href={`/admin/lessons/${lesson.id}`}
                              prefetch={false}
                            />
                          }
                        >
                          فتح وإدارة
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
