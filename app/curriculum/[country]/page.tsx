import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";
import { normalizeArabicDisplayText } from "@/lib/seo/normalize-arabic-display";
import { groupPublicDirectoryLessons } from "@/lib/curriculum/public-directory-grouping";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";
import { getSiteUrl } from "@/lib/site";

// Public country directories are relatively stable; a longer ISR interval
// reduces burst regeneration under SEO crawls while retaining periodic updates.
export const revalidate = 10800;
export const dynamicParams = false;

export function generateStaticParams() {
  return ARAB_COUNTRY_CODES.map((code) => ({
    country: code.toLowerCase(),
  }));
}

type PageProps = {
  params: Promise<{ country: string }>;
};

type GradeCatalogRow = {
  id: string;
  name_ar: string;
  grade_number: number | null;
  curricula:
    | {
        id: string;
        name_ar: string;
        academic_year: string | null;
        countries:
          | {
              code: string;
              name_ar: string;
            }
          | Array<{
              code: string;
              name_ar: string;
            }>
          | null;
      }
    | Array<{
        id: string;
        name_ar: string;
        academic_year: string | null;
        countries:
          | {
              code: string;
              name_ar: string;
            }
          | Array<{
              code: string;
              name_ar: string;
            }>
          | null;
      }>
    | null;
};

type SeoLessonRow = {
  id: string;
  title: string;
  lesson_number: number | null;
  sort_order: number | null;
  unit_id: string;
  unit_title: string;
  unit_number: number | null;
  unit_sort_order: number | null;
  unit_semester: number | null;
  lesson_semester: number | null;
  curriculum_id: string;
  curriculum_name: string;
  grade_name: string;
  grade_number: number | null;
};

function countryInfo(raw: string) {
  const code = raw.trim().toUpperCase();

  if (!(ARAB_COUNTRY_CODES as readonly string[]).includes(code)) {
    return null;
  }

  return (
    getArabicCountryOptions().find((item) => item.code === code) ??
    null
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { country } = await params;
  const info = countryInfo(country);

  if (!info) {
    return {
      title: "مناهج اللغة العربية",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `مناهج اللغة العربية في ${info.name}`,
    description:
      `دليل دروس ومناهج اللغة العربية المنشورة في ضاديوم لطلاب ${info.name}، مرتبة حسب الصف والوحدة.`,
    alternates: {
      canonical:
        `/curriculum/${info.code.toLowerCase()}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CountryCurriculumPage({
  params,
}: PageProps) {
  const { country } = await params;
  const info = countryInfo(country);

  if (!info) {
    notFound();
  }

  const db = createClient(
    SUPABASE_PUBLIC_URL,
    SUPABASE_PUBLIC_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  // Independent read-only catalog and lesson queries may overlap to lower
  // server response time without changing SSR output or the ISR policy.
  const lessonsPromise = (async (): Promise<SeoLessonRow[]> => {
      const rows: SeoLessonRow[] = [];
      const pageSize = 1000;
  
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await db
          .from("seo_indexable_lessons_fast")
          .select(
            "id,title,lesson_number,sort_order,unit_id,unit_title,unit_number,unit_sort_order,unit_semester,lesson_semester,curriculum_id,curriculum_name,grade_name,grade_number",
          )
          .eq("country_code", info.code)
          .order("grade_number", {
            ascending: true,
          })
          .order("unit_sort_order", {
            ascending: true,
          })
          .order("sort_order", {
            ascending: true,
          })
          // Stable tie breaker prevents page-boundary duplication or loss.
          .order("id", { ascending: true })
          .range(
            from,
            from + pageSize - 1,
          );
  
        if (error) {
          console.error(
            "SEO_CURRICULUM_DIRECTORY_FAILED",
            {
              country: info.code,
              message: error.message,
            },
          );
          throw new Error(`SEO_CURRICULUM_DIRECTORY_FAILED:${info.code}`);
        }
  
        const batch =
          (data ?? []) as unknown as
            SeoLessonRow[];
  
        rows.push(...batch);
  
        if (batch.length < pageSize) {
          break;
        }
      }
    return rows;
  })();

  const { data: gradeCatalogData, error: gradeCatalogError } =
    await db
      .from("grades")
      .select(
        "id,name_ar,grade_number,curricula!inner(id,name_ar,academic_year,countries!inner(code,name_ar))",
      )
      .eq("is_active", true)
      .eq("curricula.is_active", true)
      .eq(
        "curricula.countries.code",
        info.code,
      )
      .order("grade_number", {
        ascending: true,
      });

  const gradeCatalog =
    (gradeCatalogData ?? []) as unknown as GradeCatalogRow[];

  const curriculumNames =
    new Set<string>();
  const academicYears =
    new Set<string>();

  for (const grade of gradeCatalog) {
    const curriculum = Array.isArray(
      grade.curricula,
    )
      ? grade.curricula[0]
      : grade.curricula;

    if (curriculum?.name_ar) {
      curriculumNames.add(
        curriculum.name_ar,
      );
    }

    const academicYear =
      curriculum?.academic_year?.trim();

    if (academicYear) {
      academicYears.add(
        academicYear,
      );
    }
  }

  const activeGradeNumbers =
    new Set(
      gradeCatalog
        .flatMap((grade) => {
          if (
            grade.grade_number === null
          ) {
            return [];
          }

          const gradeNumber =
            Number(
              grade.grade_number,
            );

          return Number.isInteger(
            gradeNumber,
          ) &&
            gradeNumber >= 1 &&
            gradeNumber <= 13
            ? [gradeNumber]
            : [];
        }),
    );

  const rows = await lessonsPromise;

  if (gradeCatalogError) {
    console.error("SEO_CURRICULUM_GRADES_FAILED", {
      country: info.code,
      code: gradeCatalogError.code,
    });
    throw new Error(`SEO_CURRICULUM_GRADES_FAILED:${info.code}`);
  }

  // Secondary streams frequently reuse both grade names and unit names.
  // Group by country -> numeric grade -> curriculum ID -> unit ID.
  // A grade therefore exposes exactly one canonical destination.
  const gradeGroups = groupPublicDirectoryLessons(rows);

  const orderedActiveGradeNumbers =
    [...activeGradeNumbers].sort(
      (a, b) => a - b,
    );

  // Adult and continuing education can have named non-numeric levels.
  // Do not silently hide these valid paths from the public country directory.
  const continuingGradeNames = [...new Set(
    gradeCatalog
      .filter((grade) => grade.grade_number === null)
      .map((grade) => grade.name_ar?.trim())
      .filter((name): name is string => Boolean(name)),
  )].sort((a, b) => a.localeCompare(b, "ar"));

  const indexableGradeNumbers =
    new Set(
      gradeGroups.map(
        (grade) =>
          grade.gradeNumber,
      ),
    );

  const indexableUnitCount =
    gradeGroups.reduce(
      (total, grade) =>
        total +
        grade.tracks.reduce((sum, track) => sum + track.units.length, 0),
      0,
    );

  const site = getSiteUrl();
  const countryPath =
    `/curriculum/${info.code.toLowerCase()}`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ضاديوم",
          item: site,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "دليل المناهج",
          item: `${site}/curriculum`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `مناهج ${info.name}`,
          item: `${site}${countryPath}`,
        },
      ],
    },
    ...(gradeGroups.length > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name:
              `صفوف اللغة العربية في ${info.name}`,
            numberOfItems:
              gradeGroups.length,
            itemListElement:
              gradeGroups.map(
                (grade, index) => ({
                  "@type":
                    "ListItem",
                  position:
                    index + 1,
                  name:
                    grade.gradeName,
                  url:
                    `${site}${countryPath}/${grade.gradeNumber}`,
                }),
              ),
          },
        ]
      : []),
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f1e6] px-4 py-12 text-[#202c29]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              structuredData,
            ).replace(
              /</g,
              "\\u003c",
            ),
        }}
      />
      <div className="mx-auto w-full max-w-[1500px]">
        <nav
          className="mb-8 text-sm font-bold text-[#6d665c]"
          aria-label="مسار التنقل"
        >
          <Link
            href="/"
            className="hover:underline"
          >
            ضاديوم
          </Link>
          <span className="mx-2">
            ←
          </span>
          <Link
            href="/curriculum"
            className="hover:underline"
          >
            دليل المناهج
          </Link>
          <span className="mx-2">
            ←
          </span>
          <span>
            {info.name}
          </span>
        </nav>

        <header className="rounded-[2rem] border border-[#d8c7a4] bg-[#fffdf8] p-7 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#9a712c]">
            مناهج {info.name}
          </p>
          <h1 className="mt-3 font-arabic-display text-4xl font-black leading-[1.4] text-[#123f39]">
            دروس اللغة العربية في{" "}
            {info.name}
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/search?country=${info.code}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cdbb96] bg-white px-5 py-3 font-black text-[#123f39]">
              <span aria-hidden="true">🔍</span> ابحث عن دروس {info.name}
            </Link>
            <Link href={"/study/" + info.code.toLowerCase() + "/1"} prefetch={false} className="inline-flex min-h-11 items-center rounded-full border border-[#afc5ab] bg-[#e8f5eb] px-5 py-3 font-black text-[#123f39]">تدريبات عربية جاهزة بالمثال والإجابة ←</Link>
            <Link
              href={`/courses?country=${info.code}&grade=1`}
              prefetch={false}
              className="inline-flex min-h-11 items-center rounded-full bg-[#123f39] px-6 py-3 font-black text-white hover:bg-[#1b5c53]"
            >
              افتح جميع دروس {info.name} حسب الصف والفصل ←
            </Link>
          </div>
          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#655e54]">
            دليل قابل للزحف يوضح
            المناهج والمسارات
            والصفوف المتاحة في
            ضاديوم، ويصل منها إلى
            الدروس ذات المحتوى
            الفريد المؤهل للفهرسة.
          </p>
        </header>

        <section className="mt-8 rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-[#123f39]">
            نظرة سريعة على التغطية
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-[#f8f1e5] p-4">
              <div className="text-2xl font-black text-[#123f39]">
                {curriculumNames.size}
              </div>
              <div className="mt-1 text-sm font-bold text-[#6d665c]">
                منهج أو مسار نشط
              </div>
            </div>
            <div className="rounded-2xl bg-[#f8f1e5] p-4">
              <div className="text-2xl font-black text-[#123f39]">
                {activeGradeNumbers.size}
              </div>
              <div className="mt-1 text-sm font-bold text-[#6d665c]">
                صف دراسي ظاهر في الدليل
              </div>
            </div>
            <div className="rounded-2xl bg-[#f8f1e5] p-4">
              <div className="text-2xl font-black text-[#123f39]">
                {indexableUnitCount}
              </div>
              <div className="mt-1 text-sm font-bold text-[#6d665c]">
                وحدة ضمن المحتوى المؤهل للفهرسة
              </div>
            </div>
            <div className="rounded-2xl bg-[#f8f1e5] p-4">
              <div className="text-2xl font-black text-[#123f39]">
                {rows.length}
              </div>
              <div className="mt-1 text-sm font-bold text-[#6d665c]">
                درس فريد جاهز للعرض المباشر
              </div>
            </div>
          </div>

          {academicYears.size > 0 ? (
            <div className="mt-5">
              <h3 className="font-black text-[#8b6426]">
                السنة الدراسية
              </h3>
              <p className="mt-2 font-bold leading-7 text-[#4c554f]">
                {[...academicYears]
                  .sort()
                  .join(" • ")}
              </p>
            </div>
          ) : null}

          {curriculumNames.size > 0 ? (
            <div className="mt-5">
              <h3 className="font-black text-[#8b6426]">
                المناهج والمسارات
              </h3>
              <ul className="mt-3 grid gap-2 md:grid-cols-2">
                {[...curriculumNames]
                  .sort((a, b) =>
                    a.localeCompare(
                      b,
                      "ar",
                    ),
                  )
                  .map((name) => (
                    <li
                      key={name}
                      className="rounded-xl border border-[#eadfc9] bg-white px-4 py-3 font-bold text-[#4c554f]"
                    >
                      {name}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {orderedActiveGradeNumbers.length > 0 ? (
            <div className="mt-5">
              <h3 className="font-black text-[#8b6426]">
                الصفوف المتاحة
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderedActiveGradeNumbers.map(
                  (gradeNumber) =>
                    indexableGradeNumbers.has(
                      gradeNumber,
                    ) ? (
                      <Link
                        key={gradeNumber}
                        href={`/curriculum/${info.code.toLowerCase()}/${gradeNumber}`}
                        prefetch={false}
                        className="rounded-full border border-[#d8c7a4] bg-white px-3 py-2 text-sm font-black text-[#174f47] hover:border-[#8ca99f]"
                      >
                        الصف {gradeNumber}
                      </Link>
                    ) : (
                      <Link
                        key={gradeNumber}
                        href={`/courses?country=${info.code}&grade=${gradeNumber}`}
                        prefetch={false}
                        className="inline-flex min-h-11 items-center rounded-full border border-[#eadfc9] bg-[#f8f1e5] px-4 py-2 text-sm font-black text-[#174f47] hover:border-[#8ca99f]"
                      >
                        الصف {gradeNumber} • الدروس المتاحة
                      </Link>
                    ),
                )}
              </div>
              <p className="mt-3 text-sm font-bold leading-7 text-[#6d665c]">
                الرابط المباشر يظهر
                للصفوف التي تحتوي
                حاليًا على درس يحقق
                بوابة الفهرسة؛ وتظل
                بقية الصفوف متاحة
                داخل مستكشف المناهج.
              </p>
            </div>
          ) : null}

          {continuingGradeNames.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[#d5cab4] bg-[#f8f1e5] p-5">
              <h3 className="text-xl font-black text-[#123f39]">
                التعليم المستمر والمسارات غير المرتبطة برقم صف
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#655e54]">
                هذه مستويات معتمدة في دليل المنصة بأسماء خاصة، وليست صفوفًا رقمية.
                تصفّح دروسها المنشورة من مستكشف المناهج.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {continuingGradeNames.map((name) => (
                  <li key={name} className="rounded-full border border-[#d5cab4] bg-white px-4 py-2 text-sm font-bold">
                    {name}
                  </li>
                ))}
              </ul>
              <Link href={`/courses?country=${info.code}`} prefetch={false}
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#123f39] px-5 py-3 font-black text-white">
                افتح مسارات التعليم المستمر في مستكشف المناهج ←
              </Link>
            </div>
          )}
        </section>

        {gradeGroups.length ===
        0 ? (
          <section className="mt-8 rounded-3xl border border-[#ddcfb4] bg-[#fffdf8] p-7">
            <h2 className="text-2xl font-black text-[#123f39]">
              افتح المنهج الكامل
              لهذه الدولة
            </h2>
            <p className="mt-3 leading-8 text-[#655e54]">
              لا توجد حاليًا لهذه
              الدولة دروس تحقق بوابة
              الفهرسة الفريدة، لكن
              المناهج والمسارات
              والصفوف المتاحة موضحة
              أعلاه وتظل قابلة
              للاستكشاف داخل ضاديوم
              دون إدخال صفحات دروس
              مكررة إلى محركات البحث.
            </p>
            <Link
              href="/courses"
              className="mt-5 inline-flex font-black text-[#174f47] hover:underline"
            >
              افتح مستكشف المناهج
            </Link>
          </section>
        ) : (
          <div className="mt-8 space-y-8">
            {gradeGroups.map(
              (grade) => (
                <section
                  key={
                    `${grade.gradeNumber}-${grade.gradeName}`
                  }
                  className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-3xl font-black text-[#123f39]">
                      {
                        grade.gradeName
                      }
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/courses?country=${info.code}&grade=${grade.gradeNumber}`}
                        prefetch={false}
                        className="rounded-full bg-[#123f39] px-5 py-3 text-sm font-black text-white hover:bg-[#1b5c53]"
                      >
                        جميع دروس الصف في المستكشف ←
                      </Link>
                      <Link
                        href={`/curriculum/${info.code.toLowerCase()}/${grade.gradeNumber}`}
                        prefetch={false}
                        className="rounded-full border border-[#d8c7a4] bg-white px-4 py-3 text-sm font-black text-[#174f47] transition hover:border-[#8ca99f]"
                      >
                        دليل الدروس القابلة للفهرسة
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {grade.tracks.map((track) => (
                      <div key={track.id} className="rounded-2xl border border-[#e5dac5] bg-[#fffdf8] p-4 sm:p-5">
                        <h3 className="text-lg font-black leading-8 text-[#123f39]">{track.name}</h3>
                        {track.units.map((unit) => (
                          <details key={unit.id} className="group mt-3 overflow-hidden rounded-2xl border border-[#e4d7bf] bg-white">
                            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-[#123f39] marker:hidden">
                              <span className="min-w-0 break-words">{unit.title}</span>
                              <span className="shrink-0 rounded-full bg-[#f1e9d8] px-3 py-1 text-xs text-[#765b32]">
                                {unit.lessons.length} درس • معاينة سريعة
                              </span>
                            </summary>
                            <div className="border-t border-[#eee5d3] p-4">
                              <ul className="grid gap-3 md:grid-cols-2">
                                {/* Full lesson lists remain on the grade route.
                                    Previewing just three here avoids rendering hundreds
                                    of links on one country page during ISR. */}
                                {unit.lessons.slice(0, 3).map((lesson) => (
                                  <li key={lesson.id}>
                                    <Link
                                      href={`/lessons/${lesson.id}`}
                                      prefetch={false}
                                      className="block min-h-12 rounded-2xl border border-[#e5dac5] bg-[#fffdf8] px-4 py-3 font-bold text-[#244841] transition hover:border-[#8ca99f] hover:underline"
                                    >
                                      {normalizeArabicDisplayText(lesson.title)}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                              {unit.lessons.length > 3 && (
                                <p className="mt-3 text-sm font-bold text-[#655e54]">
                                  هناك {unit.lessons.length - 3} دروس أخرى؛ افتح دليل الصف أو المستكشف لعرضها كلها.
                                </p>
                              )}
                              <Link href={`/courses?country=${info.code}&grade=${grade.gradeNumber}`}
                                prefetch={false}
                                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#123f39] px-4 py-2 text-sm font-black text-white">
                                كل دروس هذا الصف والفصول في المستكشف ←
                              </Link>
                            </div>
                          </details>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  );
}
