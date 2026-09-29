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
  lesson_number: number | null;
  lesson_type: string;
  estimated_minutes: number | null;
  status: string;
  source_page_start: number | null;
  source_page_end: number | null;
  unit_id: string;
};

type UnitRow = {
  id: string;
  title: string;
  grade_id: string;
};

type GradeRow = {
  id: string;
  name_ar: string;
  grade_number: number | null;
};

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
        "id,title,slug,lesson_number,lesson_type,estimated_minutes,status,source_page_start,source_page_end,unit_id",
        { count: "estimated" },
      )
      .order("lesson_number", { ascending: true })
      .limit(50),

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

  const unitIds =
    Array.from(
      new Set(
        lessons
          .map((lesson) => lesson.unit_id)
          .filter(Boolean),
      ),
    );

  const unitsResult =
    unitIds.length > 0
      ? await supabase
          .from("units")
          .select("id,title,grade_id")
          .in("id", unitIds)
      : { data: [] as UnitRow[], error: null };

  if (unitsResult.error) {
    console.error(
      "ADMIN_LESSONS_UNITS_FETCH_ERROR:",
      unitsResult.error.message,
    );
  }

  const units =
    (unitsResult.data ?? []) as UnitRow[];

  const gradeIds =
    Array.from(
      new Set(
        units
          .map((unit) => unit.grade_id)
          .filter(Boolean),
      ),
    );

  const gradesResult =
    gradeIds.length > 0
      ? await supabase
          .from("grades")
          .select("id,name_ar,grade_number")
          .in("id", gradeIds)
      : { data: [] as GradeRow[], error: null };

  if (gradesResult.error) {
    console.error(
      "ADMIN_LESSONS_GRADES_FETCH_ERROR:",
      gradesResult.error.message,
    );
  }

  const unitById =
    new Map(
      units.map((unit) => [unit.id, unit]),
    );

  const gradeById =
    new Map(
      ((gradesResult.data ?? []) as GradeRow[])
        .map((grade) => [grade.id, grade]),
    );

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
                    unitById.get(
                      lesson.unit_id,
                    ) ?? null;

                  const grade =
                    unit
                      ? gradeById.get(
                          unit.grade_id,
                        ) ?? null
                      : null;

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
