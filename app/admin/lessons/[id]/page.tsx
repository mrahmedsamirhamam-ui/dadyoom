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
import { resolveBahrainGradeOneSource } from "@/lib/curriculum/bahrain-grade-one-source-map";
import { saveBahrainDraftCorrection, saveBahrainPublishedSourceCorrection } from "./actions";
import { publishedLessonNeedsSourceCorrection } from "@/lib/curriculum/bahrain-published-source-correction";

type Relation<T> = T | T[] | null;

function first<T>(value: Relation<T> | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

type ScopeCountry = { code: string };
type ScopeCurriculum = { countries: Relation<ScopeCountry> };
type ScopeGrade = { grade_number: number | null; curricula: Relation<ScopeCurriculum> };
type ScopeUnit = { grades: Relation<ScopeGrade> };

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
  content: string | null;
  source_pdf_url: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
  status: string;
  is_free: boolean | null;
  estimated_minutes: number | null;
  units: Relation<ScopeUnit>;
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
        content,
        source_pdf_url,
        source_page_start,
        source_page_end,
        status,
        is_free,
        estimated_minutes,
        units!inner(grades!inner(grade_number,curricula!inner(countries!inner(code))))
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

  const unit = first(lesson.units);
  const grade = first(unit?.grades);
  const curriculum = first(grade?.curricula);
  const country = first(curriculum?.countries);

  // The same lesson number repeats in different units. Only an *exact*
  // supported textbook page span may resolve to a prepared image folder.
  const imageBaseUrl = resolveBahrainGradeOneSource({
    countryCode: country?.code,
    gradeNumber: grade?.grade_number,
    sourcePageStart: lesson.source_page_start,
    sourcePageEnd: lesson.source_page_end,
  });

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

      {lesson.status === "draft" && country?.code === "BH" ? (
        <section className="rounded-2xl border border-[#d8c9aa] bg-[#fffdf8] p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#123f39]">تحرير مسودة البحرين</h2>
          <p className="mt-2 text-sm leading-7 text-[#7d5e2a]">
            الحفظ يحدّث المسودة فقط، ولا ينشرها أو يثبت مطابقتها لفهرس الكتاب.
            اكتب العنوان الصحيح من كتاب الوزارة، ومحتوى الشرح والتدريب مع مصدره.
          </p>
          <form action={saveBahrainDraftCorrection} className="mt-5 grid gap-4">
            <input type="hidden" name="lesson_id" value={lesson.id} />
            <label className="block text-sm font-bold">
              عنوان الدرس
              <input type="text" name="title" required minLength={3} maxLength={200}
                defaultValue={lesson.title} className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <label className="block text-sm font-bold">
              ملخص تعليمي
              <textarea name="summary" rows={3} maxLength={1000}
                defaultValue={lesson.summary ?? ""} className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <label className="block text-sm font-bold">
              نص الدرس والأنشطة المقترحة
              <textarea name="content" rows={12} maxLength={30000}
                defaultValue={lesson.content ?? ""} className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <label className="block text-sm font-bold">
              رابط صفحات الكتاب الرسمي (إن توفر)
              <input name="source_url" type="url" maxLength={600}
                defaultValue={lesson.source_pdf_url ?? ""} dir="ltr"
                placeholder="https://edunet.bh/..." className="mt-2 w-full rounded-xl border p-3" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                الصفحة الأولى من الكتاب
                <input name="source_page_start" type="number" min={1} max={5000}
                  defaultValue={lesson.source_page_start ?? ""}
                  className="mt-2 w-full rounded-xl border p-3" />
              </label>
              <label className="block text-sm font-bold">
                الصفحة الأخيرة من الكتاب
                <input name="source_page_end" type="number" min={1} max={5000}
                  defaultValue={lesson.source_page_end ?? ""}
                  className="mt-2 w-full rounded-xl border p-3" />
              </label>
            </div>
            <button type="submit"
              className="w-fit rounded-xl bg-[#174f47] px-6 py-3 font-black text-white">
              حفظ التصحيحات كمسودة — بدون نشر
            </button>
          </form>
        </section>
      ) : null}

      {lesson.status === "published" && country?.code === "BH" &&
        publishedLessonNeedsSourceCorrection(lesson) ? (
        <section className="rounded-2xl border border-amber-300 bg-[#fffaf1] p-5">
          <h2 className="text-xl font-black">تصحيح درس منشور يحتاج مراجعة المصدر</h2>
          <p className="mt-2 text-sm leading-8">
            هذا الدرس منشور لكن نصه أو عنوانه يحتاج مراجعة الكتاب.
            احفظ بعد مراجعة بشرية فعلية فقط؛ التعديل لا يعني اعتماد فهرس الكتاب أو مطابقة الوزارة.
          </p>
          <form action={saveBahrainPublishedSourceCorrection} className="mt-4 grid gap-4">
            <input type="hidden" name="lesson_id" value={lesson.id} />
            <label className="grid gap-2 font-bold">عنوان الدرس
              <input type="text" name="title" required minLength={3} maxLength={200}
                defaultValue={lesson.title} className="w-full rounded-xl border p-3" />
            </label>
            <label className="grid gap-2 font-bold">ملخص تعليمي أصيل
              <textarea name="summary" required rows={3} minLength={20} maxLength={1000}
                defaultValue={lesson.summary ?? ""} className="w-full rounded-xl border p-3" />
            </label>
            <label className="grid gap-2 font-bold">شرح وتدريبات أصلية مصححة
              <textarea name="content" required rows={12} minLength={180} maxLength={30000}
                defaultValue={lesson.content ?? ""} className="w-full rounded-xl border p-3" />
            </label>
            <label className="grid gap-2 font-bold">رابط الكتاب الوزاري الأصلي — ليس خطة التدريس
              <input type="url" name="source_url" required maxLength={600} dir="ltr"
                defaultValue={lesson.source_pdf_url ?? ""} className="w-full rounded-xl border p-3" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 font-bold">صفحة البداية
                <input type="number" name="source_page_start" required min={1} max={5000}
                  defaultValue={lesson.source_page_start ?? ""} className="w-full rounded-xl border p-3" />
              </label>
              <label className="grid gap-2 font-bold">صفحة النهاية
                <input type="number" name="source_page_end" required min={1} max={5000}
                  defaultValue={lesson.source_page_end ?? ""} className="w-full rounded-xl border p-3" />
              </label>
            </div>
            <label className="flex items-start gap-3 text-sm font-bold leading-7">
              <input type="checkbox" required name="textbook_checked" value="yes" className="mt-2" />
              راجعت بنفسي نص الدرس وصفحاته من الكتاب الرسمي، وأوافق على تحديث نسخة الطالب المنشورة.
            </label>
            <button type="submit" className="w-fit rounded-xl bg-[#174f47] px-6 py-3 font-black text-white">
              حفظ التصحيح بعد المراجعة — دون اعتماد الكتاب
            </button>
          </form>
        </section>
      ) : null}

      {imageBaseUrl ? (
        <AutoBuildLessonButton
          lessonId={lesson.id}
          imageBaseUrl={imageBaseUrl}
          sourcePageStart={lesson.source_page_start ?? 0}
          sourcePageEnd={lesson.source_page_end ?? 0}
        />
      ) : (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          لا توجد صور صفحات موثقة ومطابقة لهذا الدرس. لا يمكن بناء أنشطة تلقائيًا
          من صور درس آخر؛ راجع مصدر الكتاب وأرقام الصفحات أولًا.
        </section>
      )}

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
              {imageBaseUrl ?? "غير مثبت — لا يُسمح بالبناء الآلي"}
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
