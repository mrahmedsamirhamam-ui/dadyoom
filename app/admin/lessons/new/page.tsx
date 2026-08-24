import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

import LessonForm from "./lesson-form";


type NewLessonPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};


export default async function NewLessonPage({
  searchParams,
}: NewLessonPageProps) {
  const {
    error: errorMessage,
  } =
    await searchParams;

  const supabase =
    await createClient();


  /*
   * CANONICAL_NEW_LESSON_V1
   *
   * الهيكل الرسمي لضاديوم:
   *
   * countries
   * -> curricula
   * -> grades
   * -> units
   * -> lessons
   *
   * الصفوف مرتبطة مباشرة بالمنهج في النموذج الأساسي.
   */
  const [
    countriesResult,
    curriculaResult,
    gradesResult,
    unitsResult,
  ] =
    await Promise.all([
      supabase
        .from("countries")
        .select(
          "id,name_ar"
        )
        .order(
          "name_ar"
        ),

      supabase
        .from("curricula")
        .select(
          "id,name_ar,country_id"
        )
        .order(
          "name_ar"
        ),

      supabase
        .from("grades")
        .select(
          "id,name_ar,curriculum_id,grade_number"
        )
        .order(
          "grade_number"
        ),

      supabase
        .from("units")
        .select(
          "id,title,grade_id,unit_number,sort_order"
        )
        .order(
          "unit_number"
        ),
    ]);


  const loadingError =
    countriesResult.error ||
    curriculaResult.error ||
    gradesResult.error ||
    unitsResult.error;


  if (loadingError) {
    return (
      <div
        dir="rtl"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
      >
        <h1 className="text-xl font-bold text-destructive">
          تعذر تحميل بيانات المناهج
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {loadingError.message}
        </p>
      </div>
    );
  }


  return (
    <div
      className="space-y-6"
      dir="rtl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            إضافة درس جديد
          </h1>

          <p className="mt-1 text-muted-foreground">
            اختر الدولة والمنهج والصف والوحدة،
            ثم أنشئ الدرس يدويًا أو من رابط.
          </p>
        </div>

        <Button
          variant="outline"
          render={
            <Link href="/admin/lessons" />
          }
        >
          العودة إلى الدروس
        </Button>
      </div>


      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          تعذر حفظ الدرس:{" "}
          {decodeURIComponent(
            errorMessage
          )}
        </div>
      ) : null}


      <div className="rounded-xl border bg-card p-6">
        <LessonForm
          countries={
            countriesResult.data ??
            []
          }
          curricula={
            curriculaResult.data ??
            []
          }
          grades={
            gradesResult.data ??
            []
          }
          units={
            unitsResult.data ??
            []
          }
        />
      </div>
    </div>
  );
}