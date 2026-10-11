import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import bahrainBookAudit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";

import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";
import { getSiteUrl } from "@/lib/site";
import { normalizeArabicDisplayText } from "@/lib/seo/normalize-arabic-display";
import { groupPublicDirectoryLessons } from "@/lib/curriculum/public-directory-grouping";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{
    country: string;
    grade: string;
  }>;
};

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  lesson_number: number | null;
  sort_order: number | null;
  lesson_semester: number | null;
  unit_title: string;
  unit_number: number | null;
  unit_sort_order: number | null;
  unit_semester: number | null;
  grade_name: string;
  grade_number: number | null;
  curriculum_id: string;
  curriculum_name: string;
  unit_id: string;
  country_code: string;
  country_name: string;
};

function countryInfo(raw: string) {
  const code = raw.trim().toUpperCase();

  if (
    !(ARAB_COUNTRY_CODES as readonly string[]).includes(
      code,
    )
  ) {
    return null;
  }

  return (
    getArabicCountryOptions().find(
      (item) => item.code === code,
    ) ?? null
  );
}

function gradeNumber(raw: string) {
  const value = Number(raw);

  return Number.isInteger(value) &&
    value >= 1 &&
    value <= 13
    ? value
    : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    country,
    grade,
  } = await params;

  const info = countryInfo(country);
  const gradeValue = gradeNumber(grade);

  if (!info || !gradeValue) {
    return {
      title: "مناهج اللغة العربية",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title:
      `مناهج اللغة العربية ومساراتها للصف ${gradeValue} في ${info.name}`,
    description:
      `دروس العربية للصف ${gradeValue} في ${info.name} على ضاديوم، مفصولة حسب المنهج والمسار والوحدة، مع روابط للشرح والتدريب.`,
    alternates: {
      canonical:
        `/curriculum/${info.code.toLowerCase()}/${gradeValue}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function GradeCurriculumPage({
  params,
}: PageProps) {
  const {
    country,
    grade,
  } = await params;

  const info = countryInfo(country);
  const gradeValue = gradeNumber(grade);

  if (!info || !gradeValue) {
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

  const { data, error } = await db
    .from("seo_indexable_lessons_fast")
    .select(
      "id,title,summary,lesson_number,sort_order,lesson_semester,unit_id,unit_title,unit_number,unit_sort_order,unit_semester,grade_name,grade_number,curriculum_id,curriculum_name,country_code,country_name",
    )
    .eq("country_code", info.code)
    .eq("grade_number", gradeValue)
    .order("unit_sort_order", {
      ascending: true,
    })
    .order("sort_order", {
      ascending: true,
    })
    .limit(1000);

  if (error) {
    console.error(
      "SEO_GRADE_DIRECTORY_FAILED",
      {
        country: info.code,
        grade: gradeValue,
        message: error.message,
      },
    );
    notFound();
  }

  const lessons =
    (data ?? []) as LessonRow[];

  if (lessons.length === 0) {
    notFound();
  }

  const gradeName =
    lessons[0]?.grade_name?.trim() ||
    `الصف ${gradeValue}`;

  // This is a static ministry-source audit snapshot, not a live bookstore
  // parity certificate. Only Bahrain receives this country-specific notice.
  const bahrainScopeRows = info.code === "BH"
    ? bahrainBookAudit.books.filter((row) => row.grade === gradeValue)
    : [];
  const bahrainCertifiedScopes = bahrainScopeRows.filter(
    (row) => row.status === "COMPLETE_BOOK",
  ).length;
  const bahrainTerm2CurrentPlanVerified = bahrainScopeRows.some(
    (row) => row.semesterOrBookPart === 2 && row.currentPlanPublished,
  );

  const gradeDirectory = groupPublicDirectoryLessons(lessons).find(
    (entry) => entry.gradeNumber === gradeValue,
  );
  const tracks = gradeDirectory?.tracks ?? [];
  const unitCount = tracks.reduce((count, track) => count + track.units.length, 0);

  const site = getSiteUrl();
  const countryPath =
    `/curriculum/${info.code.toLowerCase()}`;
  const pagePath =
    `${countryPath}/${gradeValue}`;

  const breadcrumbJsonLd = {
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
      {
        "@type": "ListItem",
        position: 4,
        name: gradeName,
        item: `${site}${pagePath}`,
      },
    ],
  };

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
              breadcrumbJsonLd,
            ).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <nav
          aria-label="مسار التنقل"
          className="mb-8 flex flex-wrap items-center gap-2 text-sm font-bold text-[#6d665c]"
        >
          <Link
            href="/"
            className="hover:underline"
          >
            ضاديوم
          </Link>
          <span>←</span>
          <Link
            href="/curriculum"
            className="hover:underline"
          >
            دليل المناهج
          </Link>
          <span>←</span>
          <Link
            href={countryPath}
            className="hover:underline"
          >
            {info.name}
          </Link>
          <span>←</span>
          <span>{gradeName}</span>
        </nav>

        <header className="rounded-[2rem] border border-[#d8c7a4] bg-[#fffdf8] p-7 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#9a712c]">
            {info.name} • الصف {gradeValue}
          </p>

          <h1 className="mt-3 font-arabic-display text-4xl font-black leading-[1.4] text-[#123f39]">
            منهج اللغة العربية — {gradeName}
          </h1>

          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#655e54]">
            دليل مباشر للدروس ذات
            المحتوى الفريد المتاح
            لهذا الصف في ضاديوم،
            مرتب حسب الوحدات؛
            ويمكن فتح كل درس
            للشرح والتدريب والألعاب
            والـQR الذكي.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            <span className="rounded-full bg-[#eaf4f0] px-4 py-2 text-[#174f47]">
              {lessons.length} درسًا قابلًا للفهرسة
            </span>
            <span className="rounded-full bg-[#f7ecd5] px-4 py-2 text-[#8b6426]">
              {unitCount} وحدة
            </span>
            <span className="rounded-full bg-[#eaf4f0] px-4 py-2 text-[#174f47]">
              {tracks.length} منهجًا أو مسارًا
            </span>
          </div>
        </header>

        {bahrainScopeRows.length > 0 ? (
          <section aria-labelledby="bahrain-book-evidence-title" className="mt-8 rounded-[2rem] border border-[#dfc58d] bg-[#fff9e9] p-6 sm:p-8">
            <h2 id="bahrain-book-evidence-title" className="text-2xl font-black text-[#123f39]">
              حالة توثيق الكتب البحرينية — 2026–2027
            </h2>
            <p className="mt-3 leading-8 text-[#655e54]">
              هذه الصفحة تعرض دروسًا تعليمية قابلة للفهرسة، وليست شهادة اكتمال لجميع كتب هذا الصف.
              يغطي تقرير المراجعة {bahrainScopeRows.length} نطاقًا لهذا الصف بحسب الفصل أو المسار،
              ويثبت المطابقة المستقلة لفهرس الكتاب في {bahrainCertifiedScopes} منها فقط.
            </p>
            {!bahrainTerm2CurrentPlanVerified ? (
              <p className="mt-3 font-bold leading-8 text-[#865b16]">
                لم يثبت في تقرير المراجعة جدول رسمي للفصل الثاني من 2026–2027.
                بعض مواد الفصل الثاني المتاحة قد تستند إلى سنوات سابقة أو تكون مواد إثرائية،
                ولا تُعامل تلقائيًا باعتبارها جدول هذا العام.
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-[#655e54]">
              المصدر: تقرير تدقيق محفوظ بالمنصة، آخر تاريخ مرجعي {bahrainBookAudit.auditedAt}.
              لا تعني أسماء الكتب في الدليل الرسمي التحقق من جميع صفحات فهارسها.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-black text-[#174f47]">
              <a href="https://edunet.bh/Econtent/LessonsGuide" target="_blank" rel="noopener noreferrer" className="underline">
                خطط الدروس في وزارة التربية والتعليم ↗
              </a>
              <a href="https://edunet.bh/Econtent/BooksGuide" target="_blank" rel="noopener noreferrer" className="underline">
                دليل الكتب الرسمي ↗
              </a>
            </div>
          </section>
        ) : null}

        <div className="mt-8 space-y-7">
          {tracks.map((track) => (
            <section key={track.id} className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-[#123f39]">{track.name}</h2>
                <span className="rounded-full bg-[#eaf4f0] px-4 py-2 text-sm font-bold text-[#174f47]">
                  {track.lessonCount} درسًا
                </span>
              </div>
              {info.code === "BH" && /الجزء الثاني/u.test(track.name) ? (
                <p className="mt-3 text-sm font-bold leading-7 text-[#865b16]">
                  هذا محتوى كتاب من الجزء الثاني، وليس إثباتًا بوجود خطة رسمية حالية للفصل الثاني 2026–2027.
                </p>
              ) : null}
              <div className="mt-5 space-y-5">
                {track.units.map((unit) => (
                  <div key={unit.id} className="rounded-2xl border border-[#e8ddc8] bg-white p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-black text-[#123f39]">{unit.title}</h3>
                      {unit.semester ? (
                        <span className="rounded-full bg-[#f8f1e5] px-3 py-1.5 text-xs font-black text-[#8b6426]">
                          الجزء الدراسي {unit.semester}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                      {unit.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link
                            href={`/lessons/${lesson.id}`}
                            prefetch={false}
                            className="block h-full rounded-2xl border border-[#e5dac5] bg-[#fffdf8] p-4 transition hover:border-[#8ca99f] hover:shadow-sm"
                          >
                            <h4 className="font-black leading-7 text-[#244841]">
                              {normalizeArabicDisplayText(lesson.title)}
                            </h4>
                            {lesson.summary ? (
                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6d665c]">{lesson.summary}</p>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={countryPath}
            className="rounded-2xl border border-[#cdbb96] bg-[#fffdf8] px-5 py-3 font-black text-[#174f47]"
          >
            كل صفوف {info.name}
          </Link>

          <Link
            href="/curriculum"
            className="rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white"
          >
            كل الدول
          </Link>
        </div>
      </div>
    </main>
  );
}
