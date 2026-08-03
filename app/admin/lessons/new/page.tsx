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
  const { error: errorMessage } = await searchParams;
  const supabase = await createClient();

  const [
    countriesResult,
    curriculaResult,
    stagesResult,
    gradesResult,
    unitsResult,
  ] = await Promise.all([
    supabase
      .from("countries")
      .select("id, name_ar")
      .order("name_ar"),

    supabase
      .from("curricula")
      .select("id, name_ar, country_id")
      .order("name_ar"),

    supabase
      .from("educational_stages")
      .select("id, name_ar, curriculum_id")
      .order("name_ar"),

    supabase
      .from("grades")
      .select("id, name_ar, stage_id")
      .order("name_ar"),

    supabase
      .from("units")
      .select("id, title, grade_id")
      .order("title"),
  ]);

  const loadingError =
    countriesResult.error ||
    curriculaResult.error ||
    stagesResult.error ||
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
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            إضافة درس جديد
          </h1>

          <p className="mt-1 text-muted-foreground">
            اختر مكان الدرس داخل المنهج، ثم أدخل بياناته الأساسية.
          </p>
        </div>

        <Button
          variant="outline"
          render={<Link href="/admin/lessons" />}
        >
          العودة إلى الدروس
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          تعذر حفظ الدرس: {decodeURIComponent(errorMessage)}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <LessonForm
          countries={countriesResult.data ?? []}
          curricula={curriculaResult.data ?? []}
          stages={stagesResult.data ?? []}
          grades={gradesResult.data ?? []}
          units={unitsResult.data ?? []}
        />
      </div>
    </div>
  );
}