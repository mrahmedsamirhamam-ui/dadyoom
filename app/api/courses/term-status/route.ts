import { NextResponse } from "next/server";

import { ARAB_COUNTRY_CODES } from "@/lib/countries";
import { createClient } from "@/lib/supabase/server";

type CurriculumRow = {
  id: string;
  name_ar: string;
  academic_year: string | null;
};

type GradeRow = {
  curriculum_id: string;
};

type TermRow = {
  curriculum_id: string;
  semester: number;
  publication_status: string;
  detail_status: string;
  source_url: string | null;
  audited_at: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = String(
    url.searchParams.get("country") ?? "",
  )
    .trim()
    .toUpperCase();
  const gradeNumber = Number(
    url.searchParams.get("grade") ?? 0,
  );

  if (
    !(ARAB_COUNTRY_CODES as readonly string[]).includes(
      countryCode,
    ) ||
    !Number.isInteger(gradeNumber) ||
    gradeNumber < 1 ||
    gradeNumber > 13
  ) {
    return NextResponse.json(
      { error: "اختيار الدولة أو الصف غير صالح." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: country, error: countryError } =
    await supabase
      .from("countries")
      .select("id")
      .eq("code", countryCode)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

  if (countryError) {
    return NextResponse.json(
      { error: "تعذر تحميل حالة الفصول." },
      { status: 503 },
    );
  }

  if (!country) {
    return NextResponse.json({ curricula: [] });
  }

  const { data: curriculaData, error: curriculaError } =
    await supabase
      .from("curricula")
      .select("id,name_ar,academic_year")
      .eq("country_id", country.id)
      .eq("is_active", true)
      .limit(50);

  if (curriculaError) {
    return NextResponse.json(
      { error: "تعذر تحميل حالة الفصول." },
      { status: 503 },
    );
  }

  const curricula = (curriculaData ?? []) as CurriculumRow[];
  const curriculumIds = curricula.map((item) => item.id);

  if (curriculumIds.length === 0) {
    return NextResponse.json({ curricula: [] });
  }

  const { data: gradeRows, error: gradeError } =
    await supabase
      .from("grades")
      .select("curriculum_id")
      .in("curriculum_id", curriculumIds)
      .eq("grade_number", gradeNumber)
      .eq("is_active", true)
      .limit(80);

  if (gradeError) {
    return NextResponse.json(
      { error: "تعذر تحميل حالة الفصول." },
      { status: 503 },
    );
  }

  const gradeCurriculumIds = new Set(
    ((gradeRows ?? []) as GradeRow[]).map(
      (item) => item.curriculum_id,
    ),
  );

  if (gradeCurriculumIds.size === 0) {
    return NextResponse.json({ curricula: [] });
  }

  const ids = [...gradeCurriculumIds];

  const { data: termRows, error: termError } =
    await supabase
      .from("curriculum_grade_terms")
      .select(
        "curriculum_id,semester,publication_status,detail_status,source_url,audited_at",
      )
      .in("curriculum_id", ids)
      .eq("grade_number", gradeNumber)
      .order("semester", { ascending: true })
      .limit(160);

  if (termError) {
    // Countries that have not adopted grade-level term metadata yet must
    // keep using the existing catalog without failing the whole page.
    console.warn("CURRICULUM_GRADE_TERMS_UNAVAILABLE", {
      code: termError.code ?? null,
      message: termError.message,
      countryCode,
      gradeNumber,
    });

    return NextResponse.json({ curricula: [] });
  }

  const terms = (termRows ?? []) as TermRow[];
  const termCurriculumIds = new Set(
    terms.map((item) => item.curriculum_id),
  );

  const payload = curricula
    .filter(
      (item) =>
        gradeCurriculumIds.has(item.id) &&
        termCurriculumIds.has(item.id),
    )
    .map((item) => ({
      id: item.id,
      name: item.name_ar,
      academicYear: item.academic_year,
      terms: terms
        .filter((term) => term.curriculum_id === item.id)
        .map((term) => ({
          semester: Number(term.semester),
          publicationStatus: term.publication_status,
          detailStatus: term.detail_status,
          sourceUrl: term.source_url,
          auditedAt: term.audited_at,
        })),
    }));

  return NextResponse.json(
    { curricula: payload },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}
