import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const BAHRAIN_CONTINUING_LEVELS = [
  "الأول محو الأمية",
  "الثاني محو الأمية",
  "الأول متابعة",
  "الثاني متابعة",
  "الأول تقوية",
  "الثاني تقوية",
] as const;

type UnitRow = {
  id: string;
  title: string;
  description: string | null;
  semester: number | null;
  sort_order: number | null;
};

type LessonRow = {
  id: string;
  unit_id: string;
  title: string;
  lesson_type: string;
  summary: string | null;
  lesson_number: number | null;
  sort_order: number | null;
  semester: number | null;
  source_pdf_url: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
};

type TermRow = {
  semester: number;
  publication_status: string;
  detail_status: string;
  source_url: string | null;
  audited_at: string;
};

function unavailable() {
  return NextResponse.json(
    { error: "تعذر تحميل دروس التعليم المستمر الآن." },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = String(
    url.searchParams.get("country") ?? "",
  )
    .trim()
    .toUpperCase();
  const level = String(
    url.searchParams.get("level") ?? "",
  ).trim();

  if (
    countryCode !== "BH" ||
    !(
      BAHRAIN_CONTINUING_LEVELS as readonly string[]
    ).includes(level)
  ) {
    return NextResponse.json(
      { error: "اختيار مستوى التعليم المستمر غير صالح." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: country, error: countryError } =
    await supabase
      .from("countries")
      .select("id")
      .eq("code", "BH")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

  if (countryError) return unavailable();
  if (!country) {
    return NextResponse.json({ units: [], terms: [] });
  }

  const { data: curriculum, error: curriculumError } =
    await supabase
      .from("curricula")
      .select("id,academic_year")
      .eq("country_id", country.id)
      .eq("name_ar", "اللغة العربية — التعليم المستمر")
      .eq("academic_year", "2026-2027")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

  if (curriculumError) return unavailable();
  if (!curriculum) {
    return NextResponse.json({ units: [], terms: [] });
  }

  const { data: grade, error: gradeError } =
    await supabase
      .from("grades")
      .select("id,name_ar")
      .eq("curriculum_id", curriculum.id)
      .eq("name_ar", level)
      .is("grade_number", null)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

  if (gradeError) return unavailable();
  if (!grade) {
    return NextResponse.json({ units: [], terms: [] });
  }

  const { data: unitsData, error: unitsError } =
    await supabase
      .from("units")
      .select("id,title,description,semester,sort_order")
      .eq("grade_id", grade.id)
      .order("sort_order", { ascending: true })
      .limit(20);

  if (unitsError) return unavailable();

  const units = (unitsData ?? []) as UnitRow[];
  const unitIds = units.map((item) => item.id);

  let lessons: LessonRow[] = [];

  if (unitIds.length > 0) {
    const { data: lessonRows, error: lessonsError } =
      await supabase
        .from("lessons")
        .select(
          "id,unit_id,title,lesson_type,summary,lesson_number,sort_order,semester,source_pdf_url,source_page_start,source_page_end",
        )
        .in("unit_id", unitIds)
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .limit(300);

    if (lessonsError) return unavailable();
    lessons = (lessonRows ?? []) as LessonRow[];
  }

  const { data: track, error: trackError } =
    await supabase
      .from("secondary_tracks")
      .select("id")
      .eq("country_code", "BH")
      .eq("academic_year", "2026-2027")
      .eq("track_name_ar", "التعليم المستمر")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

  if (trackError) return unavailable();

  let terms: TermRow[] = [];

  if (track) {
    const { data: termRows, error: termError } =
      await supabase
        .from("secondary_track_terms")
        .select(
          "semester,publication_status,detail_status,source_url,audited_at",
        )
        .eq("secondary_track_id", track.id)
        .eq("academic_year", "2026-2027")
        .order("semester", { ascending: true })
        .limit(10);

    if (termError) return unavailable();
    terms = (termRows ?? []) as TermRow[];
  }

  const payloadUnits = units.map((unit) => ({
    id: unit.id,
    title: unit.title,
    description: unit.description,
    semester: unit.semester,
    order: Number(unit.sort_order ?? 0),
    lessons: lessons
      .filter((lesson) => lesson.unit_id === unit.id)
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        lessonType: lesson.lesson_type,
        summary: lesson.summary,
        order: Number(
          lesson.lesson_number ??
            lesson.sort_order ??
            0,
        ),
        semester: lesson.semester,
        sourcePdfUrl: lesson.source_pdf_url,
        sourcePageStart: lesson.source_page_start,
        sourcePageEnd: lesson.source_page_end,
      })),
  }));

  return NextResponse.json(
    {
      level,
      academicYear:
        curriculum.academic_year ?? "2026-2027",
      units: payloadUnits,
      lessonCount: lessons.length,
      terms: terms.map((term) => ({
        semester: Number(term.semester),
        publicationStatus: term.publication_status,
        detailStatus: term.detail_status,
        sourceUrl: term.source_url,
        auditedAt: term.audited_at,
      })),
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=300",
      },
    },
  );
}
