import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ARAB_COUNTRY_CODES } from "@/lib/countries";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";
import { SUPABASE_PUBLIC_KEY, SUPABASE_PUBLIC_URL } from "@/lib/supabase/public-config";

// Search the actual published lesson table, not the SEO-only sitemap view.
// Public anon/RLS credentials cannot read drafts or private teacher content.
export const dynamic = "force-dynamic";

type Relation<T> = T | T[] | null;
type Country = { code: string; name_ar: string; is_active: boolean };
type Curriculum = {
  id: string; name_ar: string; is_active: boolean;
  countries: Relation<Country>;
};
type Grade = {
  id: string; name_ar: string; grade_number: number | null; is_active: boolean;
  curricula: Relation<Curriculum>;
};
type Unit = { id: string; title: string; grades: Relation<Grade> };
type LessonSearchRow = {
  id: string; title: string; summary: string | null;
  units: Relation<Unit>;
};

function one<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const term = (url.searchParams.get("q") ?? "").trim().replace(/\s+/gu, " ");
  const countryCode = (url.searchParams.get("country") ?? "").trim().toUpperCase();
  const gradeValue = url.searchParams.get("grade") ?? "";
  const grade = gradeValue ? Number(gradeValue) : null;
  const pageValue = Number(url.searchParams.get("page") ?? "1");

  if (term.length < 2 || term.length > 80 || /[\\%_]/u.test(term)) {
    return NextResponse.json(
      { error: "اكتب كلمتين على الأقل أو اسم درس واضح (من حرفين إلى 80 حرفًا، دون رموز البحث)." },
      { status: 400 },
    );
  }
  if (countryCode &&
      !(ARAB_COUNTRY_CODES as readonly string[]).includes(countryCode)) {
    return NextResponse.json({ error: "الدولة غير معروفة." }, { status: 400 });
  }
  if (grade !== null && (!Number.isInteger(grade) || grade < 1 ||
    grade > (countryCode ? maxGradeForCountry(countryCode) : 13))) {
    return NextResponse.json({ error: "الصف الدراسي غير صحيح لهذه الدولة." }, { status: 400 });
  }
  if (!Number.isInteger(pageValue) || pageValue < 1 || pageValue > 50) {
    return NextResponse.json({ error: "رقم الصفحة غير صحيح." }, { status: 400 });
  }

  const db = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const pageSize = 24;
  const start = (pageValue - 1) * pageSize;

  let query = db
    .from("lessons")
    .select("id,title,summary,units!inner(id,title,grades!inner(id,name_ar,grade_number,is_active,curricula!inner(id,name_ar,is_active,countries!inner(code,name_ar,is_active))))")
    .eq("status", "published")
    .eq("units.grades.is_active", true)
    .eq("units.grades.curricula.is_active", true)
    .eq("units.grades.curricula.countries.is_active", true)
    .ilike("title", `%${term}%`);
  if (countryCode) query = query.eq("units.grades.curricula.countries.code", countryCode);
  if (grade !== null) query = query.eq("units.grades.grade_number", grade);

  const { data, error } = await query
    .order("title", { ascending: true })
    .order("id", { ascending: true })
    .range(start, start + pageSize);

  if (error) {
    console.error("DADYOOM_LESSON_SEARCH_FAILED", { code: error.code, message: error.message });
    return NextResponse.json({ error: "تعذر البحث الآن. حاول مرة أخرى." }, { status: 503 });
  }

  const rows = (data ?? []) as unknown as LessonSearchRow[];
  const lessons = rows.slice(0, pageSize).flatMap((item) => {
    const unit = one(item.units);
    const schoolGrade = one(unit?.grades ?? null);
    const curriculum = one(schoolGrade?.curricula ?? null);
    const country = one(curriculum?.countries ?? null);
    if (!unit || !schoolGrade || !curriculum || !country ||
      !schoolGrade.is_active || !curriculum.is_active || !country.is_active ||
      (countryCode && country.code !== countryCode) ||
      (grade !== null && schoolGrade.grade_number !== grade)) return [];
    return [{
      id: item.id,
      title: item.title,
      summary: item.summary,
      country: country.name_ar,
      countryCode: country.code,
      grade: schoolGrade.name_ar,
      gradeNumber: schoolGrade.grade_number,
      curriculum: curriculum.name_ar,
      unit: unit.title,
      href: `/lessons/${item.id}`,
    }];
  });

  return NextResponse.json(
    { lessons, page: pageValue, hasMore: rows.length > pageSize },
    { headers: { "Cache-Control": "no-store" } },
  );
}
