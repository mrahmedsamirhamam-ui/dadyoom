import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LessonRow = {
  id: string;
  title: string | null;
  lesson_number: number | null;
};

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول." },
        { status: 401 },
      );
    }

    const {
      data: profile,
    } =
      await supabase
        .from("profiles")
        .select(
          "role,country,grade_number",
        )
        .eq(
          "id",
          user.id,
        )
        .maybeSingle();

    const role =
      String(
        profile?.role ??
          "student",
      )
        .trim()
        .toLowerCase();

    const gradeNumber =
      Number(
        profile?.grade_number,
      );

    const rawCountry =
      String(
        profile?.country ??
          "BH",
      )
        .trim()
        .toUpperCase();

    const countryCode =
      rawCountry === "BAHRAIN" ||
      rawCountry === "البحرين"
        ? "BH"
        : rawCountry;

    let query =
      supabase
        .from("lessons")
        .select(`
          id,
          title,
          lesson_number,
          units!inner(
            grades!inner(
              grade_number,
              curricula!inner(
                countries!inner(code)
              )
            )
          )
        `)
        .eq(
          "status",
          "published",
        )
        .order(
          "lesson_number",
          {
            ascending:
              true,
          },
        )
        .limit(300);

    if (
      role === "student" &&
      Number.isInteger(
        gradeNumber,
      ) &&
      gradeNumber >= 1 &&
      gradeNumber <= 12
    ) {
      query =
        query
          .eq(
            "units.grades.grade_number",
            gradeNumber,
          )
          .eq(
            "units.grades.curricula.countries.code",
            countryCode,
          );
    }

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      console.error(
        "ASK_VIDEO_LESSONS_QUERY_ERROR",
        error.message,
      );

      return NextResponse.json(
        {
          error:
            "تعذر تحميل قائمة الدروس.",
        },
        { status: 500 },
      );
    }

    const lessons =
      (
        (data ?? []) as unknown as LessonRow[]
      )
        .filter(
          (lesson) =>
            Boolean(
              lesson.id &&
                lesson.title,
            ),
        )
        .map(
          (lesson) => ({
            id:
              lesson.id,
            title:
              String(
                lesson.title,
              ),
            lessonNumber:
              lesson.lesson_number,
          }),
        );

    return NextResponse.json(
      {
        lessons,
        gradeNumber:
          Number.isInteger(
            gradeNumber,
          )
            ? gradeNumber
            : null,
        countryCode,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "ASK_VIDEO_LESSONS_ERROR",
      error instanceof Error
        ? error.message
        : error,
    );

    return NextResponse.json(
      {
        error:
          "تعذر تحميل قائمة الدروس.",
      },
      { status: 500 },
    );
  }
}
