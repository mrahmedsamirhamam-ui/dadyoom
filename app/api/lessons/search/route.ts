import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ARAB_COUNTRY_CODES } from "@/lib/countries";
import { maxGradeForCountry } from "@/lib/student/country-grade-limits";
import { isCurriculumScopeRecord, isEmptyLessonReference } from "@/lib/curriculum/lesson-content-kind";
import { isBookReference, isKnownBookReferenceId } from "@/lib/curriculum/verified-book-reference";
import { lessonNeedsSourceReview } from "@/lib/curriculum/lesson-source-review";
import { lessonTitleSearchPattern } from "@/lib/curriculum/arabic-title-search";
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
type Unit = { id: string; title: string; semester: number | null; grades: Relation<Grade> };
type LessonSearchRow = {
  id: string; title: string; summary: string | null; content: string | null;
  semester: number | null;
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

  const titlePattern = lessonTitleSearchPattern(term);
  if (!titlePattern) {
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

  // A country+grade query is common in the student search and SEO gate.
  // Resolve its small active curriculum tree *before* loading lesson text.
  // This avoids the expensive four-level PostgREST embed on every lesson hit.
  async function scopedCountryGradeSearch(): Promise<LessonSearchRow[]> {
    const countryResult = await db.from("countries")
      .select("id,code,name_ar,is_active")
      .eq("code", countryCode).eq("is_active", true).maybeSingle();
    if (countryResult.error) throw new Error("SEARCH_SCOPE_COUNTRY:" + countryResult.error.code);
    const activeCountry = countryResult.data;
    if (!activeCountry) return [];

    const curriculaResult = await db.from("curricula")
      .select("id,name_ar,is_active")
      .eq("country_id", activeCountry.id).eq("is_active", true);
    if (curriculaResult.error) throw new Error("SEARCH_SCOPE_CURRICULA:" + curriculaResult.error.code);
    const activeCurricula = curriculaResult.data ?? [];
    if (activeCurricula.length === 0) return [];
    const curriculaById = new Map(activeCurricula.map(item => [item.id, item]));

    const gradesResult = await db.from("grades")
      .select("id,curriculum_id,name_ar,grade_number,is_active")
      .in("curriculum_id", activeCurricula.map(item => item.id))
      .eq("grade_number", grade)
      .eq("is_active", true);
    if (gradesResult.error) throw new Error("SEARCH_SCOPE_GRADES:" + gradesResult.error.code);
    const activeGrades = gradesResult.data ?? [];
    if (activeGrades.length === 0) return [];
    const gradesById = new Map(activeGrades.map(item => [item.id, item]));

    const unitsResult = await db.from("units")
      .select("id,grade_id,title,semester")
      .in("grade_id", activeGrades.map(item => item.id));
    if (unitsResult.error) throw new Error("SEARCH_SCOPE_UNITS:" + unitsResult.error.code);
    const activeUnits = unitsResult.data ?? [];
    if (activeUnits.length === 0) return [];
    const unitsById = new Map(activeUnits.map(item => [item.id, item]));

    function scopedQuery(preferRegex: boolean) {
      let query = db.from("lessons")
        .select("id,title,summary,content,semester,unit_id")
        .eq("status", "published")
        .in("unit_id", activeUnits.map(item => item.id));
      query = preferRegex
        ? query.filter("title", "imatch", titlePattern)
        : query.ilike("title", `%${term.replace(/[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]/gu, "")}%`);
      return query.order("title", { ascending: true }).order("id", { ascending: true })
        .range(start, start + pageSize);
    }

    const regexResult = await scopedQuery(true);
    let matches = regexResult.data;
    let matchError = regexResult.error;
    if (matchError) {
      console.warn("DADYOOM_LESSON_SCOPED_REGEX_DEGRADED", { code: matchError.code });
      const fallback = await scopedQuery(false);
      matches = fallback.data;
      matchError = fallback.error;
    }
    if (matchError) throw new Error("SEARCH_SCOPED_LESSONS:" + matchError.code);

    // The active tree was resolved with explicit ID ownership checks.
    // Reassemble the existing response shape without extra joins.
    return (matches ?? []).flatMap(lesson => {
      const unit = unitsById.get(lesson.unit_id);
      const schoolGrade = unit && gradesById.get(unit.grade_id);
      const curriculum = schoolGrade && curriculaById.get(schoolGrade.curriculum_id);
      if (!unit || !schoolGrade || !curriculum) return [];
      return [{
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        content: lesson.content,
        semester: lesson.semester,
        units: {
          id: unit.id,
          title: unit.title,
          semester: unit.semester,
          grades: {
            id: schoolGrade.id,
            name_ar: schoolGrade.name_ar,
            grade_number: schoolGrade.grade_number,
            is_active: schoolGrade.is_active,
            curricula: {
              id: curriculum.id,
              name_ar: curriculum.name_ar,
              is_active: curriculum.is_active,
              countries: {
                code: activeCountry.code,
                name_ar: activeCountry.name_ar,
                is_active: activeCountry.is_active,
              },
            },
          },
        },
      }];
    });
  }

  // Preserve the exact same published-only and active-tree constraints in both
  // search strategies. Some PostgREST/proxy builds reject Unicode POSIX regex;
  // a student must get ordinary title search rather than a 503.
  function searchQuery(preferRegex: boolean) {
    let query = db
      .from("lessons")
      .select("id,title,summary,content,semester,units!inner(id,title,semester,grades!inner(id,name_ar,grade_number,is_active,curricula!inner(id,name_ar,is_active,countries!inner(code,name_ar,is_active))))")
      .eq("status", "published")
      .eq("units.grades.is_active", true)
      .eq("units.grades.curricula.is_active", true)
      .eq("units.grades.curricula.countries.is_active", true);
    query = preferRegex
      ? query.filter("title", "imatch", titlePattern)
      : query.ilike("title", `%${term.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")}%`);
    if (countryCode) query = query.eq("units.grades.curricula.countries.code", countryCode);
    if (grade !== null) query = query.eq("units.grades.grade_number", grade);
    return query.order("title", { ascending: true }).order("id", { ascending: true })
      .range(start, start + pageSize);
  }

  let rows: LessonSearchRow[];
  if (countryCode && grade !== null) {
    try {
      rows = await scopedCountryGradeSearch();
    } catch (cause) {
      console.error("DADYOOM_LESSON_SCOPED_SEARCH_FAILED", {
        code: cause instanceof Error ? cause.message : "unknown",
        country: countryCode,
        grade,
      });
      return NextResponse.json({ error: "تعذر البحث الآن. حاول مرة أخرى." }, { status: 503 });
    }
  } else {
    const regexResult = await searchQuery(true);
    let data = regexResult.data;
    let error = regexResult.error;
    if (error) {
      console.warn("DADYOOM_LESSON_REGEX_DEGRADED", { code: error.code });
      const fallback = await searchQuery(false);
      data = fallback.data;
      error = fallback.error;
    }
    if (error) {
      console.error("DADYOOM_LESSON_SEARCH_FAILED", { code: error.code, message: error.message });
      return NextResponse.json({ error: "تعذر البحث الآن. حاول مرة أخرى." }, { status: 503 });
    }
    rows = (data ?? []) as unknown as LessonSearchRow[];
  }
  const lessons = rows.slice(0, pageSize).flatMap((item) => {
    const unit = one(item.units);
    const schoolGrade = one(unit?.grades ?? null);
    const curriculum = one(schoolGrade?.curricula ?? null);
    const country = one(curriculum?.countries ?? null);
    if (!unit || !schoolGrade || !curriculum || !country ||
      !schoolGrade.is_active || !curriculum.is_active || !country.is_active ||
      (countryCode && country.code !== countryCode) ||
      (grade !== null && schoolGrade.grade_number !== grade)) return [];
    // Keep source-quality warnings visible to students who find existing
    // published enrichment; do not describe the material as ministry-verified.
    const resourceKind = isKnownBookReferenceId(item.id) ||
      isBookReference({
        countryCode: country.code,
        unitTitle: unit.title,
        lessonTitle: item.title,
      }) || isEmptyLessonReference(item.content)
        ? "book-reference"
        : isCurriculumScopeRecord({ summary: item.summary, content: item.content })
          ? "curriculum-scope" : "lesson";
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
      // Do not infer semesters from grades or textbook titles. A null is
      // unscoped/unknown, not proof this lesson belongs to a given term.
      semester: item.semester ?? unit.semester ?? null,
      href: `/lessons/${item.id}`,
      resourceKind,
      sourceReviewRequired: resourceKind === "lesson" && lessonNeedsSourceReview(item.content),
    }];
  });

  return NextResponse.json(
    { lessons, page: pageValue, hasMore: rows.length > pageSize },
    { headers: { "Cache-Control": "no-store" } },
  );
}
