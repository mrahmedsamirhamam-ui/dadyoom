import { NextResponse } from "next/server";

import { ARAB_COUNTRY_CODES } from "@/lib/countries";
import { createClient } from "@/lib/supabase/server";

type Country = {
  id: string;
  code: string;
  name_ar: string;
};

type Curriculum = {
  id: string;
  country_id: string;
  name_ar: string;
  academic_year: string | null;
};

type Grade = {
  id: string;
  curriculum_id: string;
  name_ar: string;
  grade_number: number | null;
};

type RawUnit = {
  id: string;
  grade_id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
  unit_number: number | null;
  semester: number | null;
};

type RawLesson = {
  id: string;
  unit_id: string;
  title: string;
  summary: string | null;
  semester: number | null;
  estimated_minutes: number | null;
  lesson_number: number | null;
  sort_order: number | null;
  status: string;
};

type Progress = {
  lesson_id: string;
  status: string | null;
  progress_percent: number | null;
  xp: number | null;
};

type SecondaryTrack = {
  id: string;
  country_code: string;
  system_name_ar: string;
  track_name_ar: string;
  grades: number[] | null;
  status: string;
  lesson_coverage: string;
  official_unit_scope: "all-mapped-curriculum" | "mapped-only";
  official_units: number;
  official_lessons: number;
  unclassified_official_lessons: number;
  official_semesters: number[] | null;
  supporting_lessons: number;
};

type TrackCurriculum = {
  secondary_track_id: string;
  curriculum_id: string;
};

type TrackUnit = {
  secondary_track_id: string;
  unit_id: string;
};

type TrackTerm = {
  secondary_track_id: string;
  semester: number;
  publication_status: string;
  detail_status: string;
  source_url: string | null;
  audited_at: string;
};

function isSecondaryGrade(
  countryCode: string,
  grade: number,
): boolean {
  return countryCode === "SO"
    ? grade >= 9
    : grade >= 10;
}

function difficulty(
  grade: number | null,
) {
  const value =
    Number(grade ?? 0);

  return value >= 9
    ? ("advanced" as const)
    : value >= 4
      ? ("intermediate" as const)
      : ("beginner" as const);
}

function errorResponse(
  stage: string,
  error: {
    message?: string;
    code?: string;
  } | null,
) {
  console.error(
    "DADYOOM_SCOPED_CATALOG_ERROR",
    {
      stage,
      code:
        error?.code ??
        null,
      message:
        error?.message ??
        "unknown",
    },
  );

  return NextResponse.json(
    {
      error:
        "تعذر تحميل دروس هذا الصف الآن.",
    },
    { status: 503 },
  );
}

export async function GET(
  request: Request,
) {
  const url =
    new URL(request.url);

  const countryCode =
    String(
      url.searchParams.get(
        "country",
      ) ?? "",
    )
      .trim()
      .toUpperCase();

  const gradeNumber =
    Number(
      url.searchParams.get(
        "grade",
      ) ?? 0,
    );

  const requestedTrackId =
    String(
      url.searchParams.get(
        "track",
      ) ?? "",
    ).trim();

  if (
    !(
      ARAB_COUNTRY_CODES as readonly string[]
    ).includes(countryCode) ||
    !Number.isInteger(
      gradeNumber,
    ) ||
    gradeNumber < 1 ||
    gradeNumber > 13
  ) {
    return NextResponse.json(
      {
        error:
          "اختيار الدولة أو الصف غير صالح.",
      },
      { status: 400 },
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  /*
   * Keep the public catalog query intentionally flat.
   * The previous PostgREST nested join over
   * countries -> curricula -> grades -> units -> lessons
   * could exceed the production request budget even for one grade.
   * These bounded lookups preserve the same catalog contract without
   * loading or rewriting curriculum content.
   */

  const {
    data: countryData,
    error: countryError,
  } =
    await supabase
      .from("countries")
      .select(
        "id,code,name_ar",
      )
      .eq(
        "code",
        countryCode,
      )
      .eq(
        "is_active",
        true,
      )
      .limit(1)
      .maybeSingle();

  if (
    countryError
  ) {
    return errorResponse(
      "country",
      countryError,
    );
  }

  if (!countryData) {
    return NextResponse.json(
      { units: [] },
      {
        headers: {
          "Cache-Control":
            user
              ? "private, no-store"
              : "public, max-age=60, s-maxage=300",
        },
      },
    );
  }

  const country =
    countryData as Country;

  let secondaryTracks: SecondaryTrack[] = [];
  let selectedSecondaryTrack: SecondaryTrack | null = null;
  let allowedCurriculumIds: Set<string> | null = null;
  let allowedOfficialUnitIds: Set<string> | null = null;
  let secondaryTrackTerms: TrackTerm[] = [];

  if (isSecondaryGrade(countryCode, gradeNumber)) {
    const {
      data: trackRows,
      error: trackError,
    } = await supabase
      .from("secondary_track_coverage")
      .select("id,country_code,system_name_ar,track_name_ar,grades,status,lesson_coverage,official_unit_scope,official_units,official_lessons,unclassified_official_lessons,official_semesters,supporting_lessons")
      .eq("country_code", countryCode)
      .eq("academic_year", "2026-2027")
      .order("system_name_ar", { ascending: true })
      .order("track_name_ar", { ascending: true })
      .limit(80);

    if (trackError) {
      return errorResponse("secondary_tracks", trackError);
    }

    secondaryTracks = ((trackRows ?? []) as SecondaryTrack[]).filter(
      (track) =>
        Array.isArray(track.grades) &&
        track.grades.length > 0 &&
        track.grades.includes(gradeNumber),
    );

    const trackIds = secondaryTracks.map((track) => track.id);

    if (trackIds.length > 0) {
      const {
        data: termRows,
        error: termError,
      } = await supabase
        .from("secondary_track_terms")
        .select("secondary_track_id,semester,publication_status,detail_status,source_url,audited_at")
        .in("secondary_track_id", trackIds)
        .eq("academic_year", "2026-2027")
        .order("semester", { ascending: true })
        .limit(240);

      if (termError) {
        return errorResponse("secondary_track_terms", termError);
      }

      secondaryTrackTerms = (termRows ?? []) as TrackTerm[];
    }

    if (requestedTrackId) {
      selectedSecondaryTrack =
        secondaryTracks.find(
          (track) => track.id === requestedTrackId,
        ) ?? null;

      if (!selectedSecondaryTrack) {
        return NextResponse.json(
          { error: "المسار الثانوي المختار غير متاح لهذا الصف." },
          { status: 400 },
        );
      }

      const {
        data: mappingRows,
        error: mappingError,
      } = await supabase
        .from("secondary_track_curricula")
        .select("secondary_track_id,curriculum_id")
        .eq("secondary_track_id", requestedTrackId)
        .limit(40);

      if (mappingError) {
        return errorResponse("secondary_track_curricula", mappingError);
      }

      allowedCurriculumIds = new Set(
        ((mappingRows ?? []) as TrackCurriculum[]).map(
          (row) => row.curriculum_id,
        ),
      );

      if (
        selectedSecondaryTrack.official_unit_scope === "mapped-only"
      ) {
        const {
          data: unitMappingRows,
          error: unitMappingError,
        } = await supabase
          .from("secondary_track_units")
          .select("secondary_track_id,unit_id")
          .eq("secondary_track_id", requestedTrackId)
          .limit(200);

        if (unitMappingError) {
          return errorResponse("secondary_track_units", unitMappingError);
        }

        allowedOfficialUnitIds = new Set(
          ((unitMappingRows ?? []) as TrackUnit[]).map(
            (row) => row.unit_id,
          ),
        );
      }
    }
  }

  const {
    data: curriculaData,
    error:
      curriculaError,
  } =
    await supabase
      .from("curricula")
      .select(
        "id,country_id,name_ar,academic_year",
      )
      .eq(
        "country_id",
        country.id,
      )
      .eq(
        "is_active",
        true,
      )
      .limit(20);

  if (
    curriculaError
  ) {
    return errorResponse(
      "curricula",
      curriculaError,
    );
  }

  const curricula =
    ((curriculaData ?? []) as Curriculum[]).filter(
      (item) =>
        !allowedCurriculumIds ||
        allowedCurriculumIds.has(item.id),
    );

  const curriculumIds =
    curricula.map(
      item => item.id,
    );

  if (
    curriculumIds.length ===
    0
  ) {
    return NextResponse.json(
      { units: [] },
      {
        headers: {
          "Cache-Control":
            user
              ? "private, no-store"
              : "public, max-age=60, s-maxage=300",
        },
      },
    );
  }

  const {
    data: gradesData,
    error: gradesError,
  } =
    await supabase
      .from("grades")
      .select(
        "id,curriculum_id,name_ar,grade_number",
      )
      .in(
        "curriculum_id",
        curriculumIds,
      )
      .eq(
        "grade_number",
        gradeNumber,
      )
      .limit(30);

  if (
    gradesError
  ) {
    return errorResponse(
      "grades",
      gradesError,
    );
  }

  const grades =
    (gradesData ??
      []) as Grade[];

  const gradeIds =
    grades.map(
      item => item.id,
    );

  if (
    gradeIds.length === 0
  ) {
    return NextResponse.json(
      { units: [] },
      {
        headers: {
          "Cache-Control":
            user
              ? "private, no-store"
              : "public, max-age=60, s-maxage=300",
        },
      },
    );
  }

  const {
    data: unitsData,
    error: unitsError,
  } =
    await supabase
      .from("units")
      .select(
        "id,grade_id,title,description,sort_order,unit_number,semester",
      )
      .in(
        "grade_id",
        gradeIds,
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        },
      )
      .order(
        "unit_number",
        {
          ascending:
            true,
        },
      )
      .limit(120);

  if (
    unitsError
  ) {
    return errorResponse(
      "units",
      unitsError,
    );
  }

  const rawUnits =
    (unitsData ??
      []) as RawUnit[];

  const unitIds =
    rawUnits.map(
      item => item.id,
    );

  if (
    unitIds.length === 0
  ) {
    return NextResponse.json(
      { units: [] },
      {
        headers: {
          "Cache-Control":
            user
              ? "private, no-store"
              : "public, max-age=60, s-maxage=300",
        },
      },
    );
  }

  const {
    data: lessonsData,
    error: lessonsError,
  } =
    await supabase
      .from("lessons")
      .select(
        "id,unit_id,title,summary,semester,estimated_minutes,lesson_number,sort_order,status",
      )
      .in(
        "unit_id",
        unitIds,
      )
      .eq(
        "status",
        "published",
      )
      .order(
        "sort_order",
        {
          ascending:
            true,
        },
      )
      .order(
        "lesson_number",
        {
          ascending:
            true,
        },
      )
      .limit(500);

  if (
    lessonsError
  ) {
    return errorResponse(
      "lessons",
      lessonsError,
    );
  }

  const lessons =
    (lessonsData ??
      []) as RawLesson[];

  const lessonIds =
    lessons.map(
      item => item.id,
    );

  let progress:
    Progress[] = [];

  if (
    user &&
    lessonIds.length >
      0
  ) {
    const {
      data:
        progressRows,
      error:
        progressError,
    } =
      await supabase
        .from(
          "student_lesson_progress",
        )
        .select(
          "lesson_id,status,progress_percent,xp",
        )
        .eq(
          "student_id",
          user.id,
        )
        .in(
          "lesson_id",
          lessonIds,
        )
        .limit(500);

    if (
      progressError
    ) {
      console.warn(
        "DADYOOM_SCOPED_CATALOG_PROGRESS_ERROR",
        {
          code:
            progressError.code ??
            null,
          message:
            progressError.message,
        },
      );
    } else {
      progress =
        (progressRows ??
          []) as Progress[];
    }
  }

  const curriculumById =
    new Map(
      curricula.map(
        item => [
          item.id,
          item,
        ],
      ),
    );

  const gradeById =
    new Map(
      grades.map(
        item => [
          item.id,
          item,
        ],
      ),
    );

  const lessonsByUnit =
    new Map<
      string,
      RawLesson[]
    >();

  for (
    const lesson of
    lessons
  ) {
    const rows =
      lessonsByUnit.get(
        lesson.unit_id,
      ) ?? [];

    rows.push(
      lesson,
    );

    lessonsByUnit.set(
      lesson.unit_id,
      rows,
    );
  }

  const progressByLesson =
    new Map(
      progress.map(
        row => [
          row.lesson_id,
          row,
        ],
      ),
    );

  const mappedUnits =
    rawUnits
      .map(
        raw => {
          const gradeRow =
            gradeById.get(
              raw.grade_id,
            );

          if (
            !gradeRow
          ) {
            return null;
          }

          const curriculum =
            curriculumById.get(
              gradeRow.curriculum_id,
            );

          if (
            !curriculum
          ) {
            return null;
          }

          if (
            requestedTrackId &&
            selectedSecondaryTrack?.official_unit_scope === "mapped-only" &&
            !curriculum.name_ar.includes(
              "المسار العربي الأساسي لضاديوم",
            ) &&
            !allowedOfficialUnitIds?.has(raw.id)
          ) {
            return null;
          }

          const unitLessons =
            (
              lessonsByUnit.get(
                raw.id,
              ) ?? []
            )
              .sort(
                (
                  a,
                  b,
                ) =>
                  Number(
                    a.sort_order ??
                      a.lesson_number ??
                      9999,
                  ) -
                  Number(
                    b.sort_order ??
                      b.lesson_number ??
                      9999,
                  ),
              )
              .map(
                (
                  lesson,
                  index,
                ) => {
                  const row =
                    progressByLesson.get(
                      lesson.id,
                    );

                  const completed =
                    row?.status ===
                      "completed" ||
                    row?.status ===
                      "mastered";

                  return {
                    id:
                      lesson.id,
                    title:
                      lesson.title,
                    objective:
                      lesson.summary,
                    semester:
                      lesson.semester == null
                        ? null
                        : Number(lesson.semester),
                    estimatedMinutes:
                      Number(
                        lesson.estimated_minutes ??
                          20,
                      ),
                    difficulty:
                      difficulty(
                        gradeRow.grade_number,
                      ),
                    points:
                      Math.max(
                        10,
                        Number(
                          row?.xp ??
                            0,
                        ),
                      ),
                    order:
                      Number(
                        lesson.sort_order ??
                          lesson.lesson_number ??
                          index +
                            1,
                      ),
                    completed,
                    progressPercent:
                      completed
                        ? 100
                        : Math.max(
                            0,
                            Math.min(
                              100,
                              Number(
                                row?.progress_percent ??
                                  0,
                              ),
                            ),
                          ),
                  };
                },
              );

          if (
            unitLessons.length ===
            0
          ) {
            return null;
          }

          return {
            id: raw.id,
            title:
              raw.title,
            description:
              raw.description,
            order:
              Number(
                raw.sort_order ??
                  raw.unit_number ??
                  9999,
              ),
            semester:
              raw.semester == null
                ? null
                : Number(raw.semester),
            country: {
              id:
                country.id,
              code:
                country.code,
              name:
                country.name_ar,
            },
            curriculum: {
              id:
                curriculum.id,
              name:
                curriculum.name_ar,
              academicYear:
                curriculum.academic_year,
            },
            grade: {
              id:
                gradeRow.id,
              name:
                gradeRow.name_ar,
              number:
                gradeRow.grade_number,
            },
            lessons:
              unitLessons,
          };
        },
      )
      .filter(
        (
          unit,
        ): unit is NonNullable<
          typeof unit
        > =>
          Boolean(
            unit,
          ),
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.order -
          b.order,
      );

  /*
   * When a grade has a sufficiently detailed official curriculum,
   * hide the older generic "official matching" bundle from the public
   * catalog. This avoids duplicate-looking official content while
   * preserving the generic bundle as the fallback for countries/grades
   * whose public official source is only verifiable at bundle/domain level.
   *
   * Dadyoom Core is never hidden.
   */
  const officialLessonCountByCurriculum =
    new Map<string, number>();

  for (const unit of mappedUnits) {
    officialLessonCountByCurriculum.set(
      unit.curriculum.id,
      (
        officialLessonCountByCurriculum.get(
          unit.curriculum.id,
        ) ?? 0
      ) + unit.lessons.length,
    );
  }

  const hasDetailedOfficialCurriculum =
    Array.from(
      officialLessonCountByCurriculum.entries(),
    ).some(
      ([curriculumId, lessonCount]) => {
        const curriculum =
          curriculumById.get(
            curriculumId,
          );

        if (!curriculum) {
          return false;
        }

        return (
          lessonCount >= 10 &&
          curriculum.name_ar.startsWith(
            "اللغة العربية — ",
          ) &&
          !curriculum.name_ar.includes(
            "المطابقة الرسمية",
          ) &&
          curriculum.name_ar !==
            "المسار العربي الأساسي لضاديوم"
        );
      },
    );

  const units =
    hasDetailedOfficialCurriculum
      ? mappedUnits.filter(
          unit =>
            !unit.curriculum.name.includes(
              "المطابقة الرسمية",
            ),
        )
      : mappedUnits;

  return NextResponse.json(
    {
      units,
      tracks: secondaryTracks.map((track) => ({
        id: track.id,
        systemName: track.system_name_ar,
        name: track.track_name_ar,
        status: track.status,
        lessonCoverage: track.lesson_coverage,
        officialUnits: Number(track.official_units ?? 0),
        officialLessons: Number(track.official_lessons ?? 0),
        unclassifiedOfficialLessons: Number(
          track.unclassified_official_lessons ?? 0,
        ),
        officialSemesters: Array.isArray(track.official_semesters)
          ? track.official_semesters.map(Number)
          : [],
        supportingLessons: Number(track.supporting_lessons ?? 0),
        terms: secondaryTrackTerms
          .filter((term) => term.secondary_track_id === track.id)
          .map((term) => ({
            semester: Number(term.semester),
            publicationStatus: term.publication_status,
            detailStatus: term.detail_status,
            sourceUrl: term.source_url,
            auditedAt: term.audited_at,
          })),
      })),
      selectedTrackId: requestedTrackId || null,
    },
    {
      headers: {
        "Cache-Control":
          user
            ? "private, no-store"
            : "public, max-age=60, s-maxage=300",
      },
    },
  );
}
