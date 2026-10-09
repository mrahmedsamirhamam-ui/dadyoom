import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";
import { normalizeArabicDisplayText } from "@/lib/seo/normalize-arabic-display";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;
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
  unit_title: string;
  unit_number: number | null;
  unit_sort_order: number | null;
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
            "id,title,lesson_number,sort_order,unit_title,unit_number,unit_sort_order,grade_name,grade_number",
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
          break;
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

  const { data: gradeCatalogData } =
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

  const groups = new Map<
    string,
    {
      gradeName: string;
      gradeNumber: number;
      units: Map<
        string,
        {
          title: string;
          order: number;
          lessons: SeoLessonRow[];
        }
      >;
    }
  >();

  for (const lesson of rows) {
    const gradeNumber =
      Number(
        lesson.grade_number ??
        999,
      );

    const gradeKey =
      `${gradeNumber}:${lesson.grade_name}`;

    if (!groups.has(gradeKey)) {
      groups.set(
        gradeKey,
        {
          gradeName:
            lesson.grade_name,
          gradeNumber,
          units: new Map(),
        },
      );
    }

    const unitOrder =
      Number(
        lesson.unit_sort_order ??
        lesson.unit_number ??
        999,
      );

    const unitKey =
      `${unitOrder}:${lesson.unit_title}`;

    const gradeGroup =
      groups.get(gradeKey)!;

    if (
      !gradeGroup.units.has(
        unitKey,
      )
    ) {
      gradeGroup.units.set(
        unitKey,
        {
          title:
            lesson.unit_title,
          order:
            unitOrder,
          lessons: [],
        },
      );
    }

    gradeGroup.units
      .get(unitKey)!
      .lessons.push(
        lesson,
      );
  }

  const gradeGroups =
    [...groups.values()].sort(
      (a, b) =>
        a.gradeNumber -
        b.gradeNumber,
    );

  const orderedActiveGradeNumbers =
    [...activeGradeNumbers].sort(
      (a, b) => a - b,
    );

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
        grade.units.size,
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
      <div className="mx-auto max-w-6xl">
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
                      <span
                        key={gradeNumber}
                        className="rounded-full border border-[#eadfc9] bg-[#f8f1e5] px-3 py-2 text-sm font-bold text-[#6d665c]"
                      >
                        الصف {gradeNumber}
                      </span>
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

                    <Link
                      href={`/curriculum/${info.code.toLowerCase()}/${grade.gradeNumber}`}
                      prefetch={false}
                      className="rounded-full border border-[#d8c7a4] bg-white px-4 py-2 text-sm font-black text-[#174f47] transition hover:border-[#8ca99f]"
                    >
                      صفحة الصف كاملة ←
                    </Link>
                  </div>

                  <div className="mt-6 space-y-6">
                    {[
                      ...grade.units.values(),
                    ]
                      .sort(
                        (
                          a,
                          b,
                        ) =>
                          a.order -
                          b.order,
                      )
                      .map(
                        (unit) => (
                          <div
                            key={
                              `${unit.order}-${unit.title}`
                            }
                          >
                            <h3 className="text-xl font-black text-[#8b6426]">
                              {
                                unit.title
                              }
                            </h3>

                            <ul className="mt-3 grid gap-3 md:grid-cols-2">
                              {unit.lessons
                                .sort(
                                  (
                                    a,
                                    b,
                                  ) =>
                                    Number(
                                      a.sort_order ??
                                      a.lesson_number ??
                                      999,
                                    ) -
                                    Number(
                                      b.sort_order ??
                                      b.lesson_number ??
                                      999,
                                    ),
                                )
                                // This hub should preview lessons, not SSR every
                                // lesson in every grade on a single page.
                                // Every full grade listing stays one click away.
                                .slice(0, 2)
                                .map(
                                  (
                                    lesson,
                                  ) => (
                                    <li
                                      key={
                                        lesson.id
                                      }
                                    >
                                      <Link
                                        href={
                                          `/lessons/${lesson.id}`
                                        }
                                        prefetch={false}
                                        className="block rounded-2xl border border-[#e5dac5] bg-white px-4 py-3 font-bold text-[#244841] transition hover:border-[#8ca99f] hover:underline"
                                      >
                                        {
                                          normalizeArabicDisplayText(
                                            lesson.title,
                                          )
                                        }
                                      </Link>
                                    </li>
                                  ),
                                )}
                            </ul>
                            {unit.lessons.length > 2 ? (
                              <p className="mt-2 text-sm font-semibold text-[#6d665c]">
                                عرض درسين من {unit.lessons.length} درسًا في هذه الوحدة.
                                <Link
                                  href={`/curriculum/${info.code.toLowerCase()}/${grade.gradeNumber}`}
                                  prefetch={false}
                                  className="mr-2 text-[#174f47] hover:underline"
                                >
                                  عرض جميع دروس الصف ←
                                </Link>
                              </p>
                            ) : null}
                          </div>
                        ),
                      )}
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
