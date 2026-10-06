import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

import {
  ARAB_COUNTRY_CODES,
  getArabicCountryOptions,
} from "@/lib/countries";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ country: string }>;
};

type Relation<T> = T | T[] | null;

type CountryRow = {
  code: string;
  name_ar: string;
};

type CurriculumRow = {
  name_ar: string;
  academic_year: string | null;
  countries: Relation<CountryRow>;
};

type GradeRow = {
  name_ar: string;
  grade_number: number | null;
  curricula: Relation<CurriculumRow>;
};

type UnitRow = {
  title: string;
  unit_number: number | null;
  sort_order: number | null;
  grades: Relation<GradeRow>;
};

type LessonRow = {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  lesson_number: number | null;
  sort_order: number | null;
  units: Relation<UnitRow>;
};

function one<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function countryInfo(raw: string) {
  const code = raw.trim().toUpperCase();
  if (!(ARAB_COUNTRY_CODES as readonly string[]).includes(code)) {
    return null;
  }
  return getArabicCountryOptions().find((item) => item.code === code) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
    description: `دليل دروس ومناهج اللغة العربية المنشورة في ضاديوم لطلاب ${info.name}، مرتبة حسب الصف والوحدة.`,
    alternates: { canonical: `/curriculum/${info.code.toLowerCase()}` },
  };
}

export default async function CountryCurriculumPage({ params }: PageProps) {
  const { country } = await params;
  const info = countryInfo(country);
  if (!info) notFound();

  const db = createClient(SUPABASE_PUBLIC_URL, SUPABASE_PUBLIC_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows: LessonRow[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from("lessons")
      .select(`
        id,title,slug,summary,lesson_number,sort_order,
        units!inner(
          title,unit_number,sort_order,
          grades!inner(
            name_ar,grade_number,
            curricula!inner(
              name_ar,academic_year,
              countries!inner(code,name_ar)
            )
          )
        )
      `)
      .eq("status", "published")
      .eq("units.grades.curricula.countries.code", info.code)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("SEO_CURRICULUM_DIRECTORY_FAILED", {
        country: info.code,
        message: error.message,
      });
      break;
    }

    const batch = (data ?? []) as unknown as LessonRow[];
    rows.push(
      ...batch.filter(
        (lesson) => !lesson.slug?.includes("-dadyoom-core-"),
      ),
    );

    if (batch.length < pageSize) break;
  }

  const groups = new Map<string, {
    gradeName: string;
    gradeNumber: number;
    units: Map<string, {
      title: string;
      order: number;
      lessons: LessonRow[];
    }>;
  }>();

  for (const lesson of rows) {
    const unit = one(lesson.units);
    const grade = one(unit?.grades ?? null);
    if (!unit || !grade) continue;

    const gradeNumber = Number(grade.grade_number ?? 999);
    const gradeKey = `${gradeNumber}:${grade.name_ar}`;

    if (!groups.has(gradeKey)) {
      groups.set(gradeKey, {
        gradeName: grade.name_ar,
        gradeNumber,
        units: new Map(),
      });
    }

    const unitKey = `${Number(unit.unit_number ?? unit.sort_order ?? 999)}:${unit.title}`;
    const gradeGroup = groups.get(gradeKey)!;

    if (!gradeGroup.units.has(unitKey)) {
      gradeGroup.units.set(unitKey, {
        title: unit.title,
        order: Number(unit.sort_order ?? unit.unit_number ?? 999),
        lessons: [],
      });
    }

    gradeGroup.units.get(unitKey)!.lessons.push(lesson);
  }

  const gradeGroups = [...groups.values()].sort(
    (a, b) => a.gradeNumber - b.gradeNumber,
  );

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-12 text-[#202c29]">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 text-sm font-bold text-[#6d665c]" aria-label="مسار التنقل">
          <Link href="/" className="hover:underline">ضاديوم</Link>
          <span className="mx-2">←</span>
          <Link href="/curriculum" className="hover:underline">دليل المناهج</Link>
          <span className="mx-2">←</span>
          <span>{info.name}</span>
        </nav>

        <header className="rounded-[2rem] border border-[#d8c7a4] bg-[#fffdf8] p-7 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#9a712c]">مناهج {info.name}</p>
          <h1 className="mt-3 font-arabic-display text-4xl font-black leading-[1.4] text-[#123f39]">
            دروس اللغة العربية في {info.name}
          </h1>
          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#655e54]">
            روابط مباشرة للدروس المنشورة ذات المحتوى الوطني أو الفريد، مرتبة حسب الصف والوحدة.
          </p>
        </header>

        {gradeGroups.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-[#ddcfb4] bg-[#fffdf8] p-7">
            <h2 className="text-2xl font-black text-[#123f39]">يتم تجهيز الدليل المنشور لهذه الدولة</h2>
            <p className="mt-3 leading-8 text-[#655e54]">
              يمكنك استخدام مستكشف المناهج التفاعلي الآن، وسيظهر هنا المحتوى الفريد بعد اعتماده للنشر.
            </p>
            <Link href="/courses" className="mt-5 inline-flex font-black text-[#174f47] hover:underline">
              افتح مستكشف المناهج
            </Link>
          </section>
        ) : (
          <div className="mt-8 space-y-8">
            {gradeGroups.map((grade) => (
              <section
                key={`${grade.gradeNumber}-${grade.gradeName}`}
                className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-8"
              >
                <h2 className="text-3xl font-black text-[#123f39]">{grade.gradeName}</h2>
                <div className="mt-6 space-y-6">
                  {[...grade.units.values()]
                    .sort((a, b) => a.order - b.order)
                    .map((unit) => (
                      <div key={`${unit.order}-${unit.title}`}>
                        <h3 className="text-xl font-black text-[#8b6426]">{unit.title}</h3>
                        <ul className="mt-3 grid gap-3 md:grid-cols-2">
                          {unit.lessons
                            .sort(
                              (a, b) =>
                                Number(a.sort_order ?? a.lesson_number ?? 999) -
                                Number(b.sort_order ?? b.lesson_number ?? 999),
                            )
                            .map((lesson) => (
                              <li key={lesson.id}>
                                <Link
                                  href={`/lessons/${lesson.id}`}
                                  className="block rounded-2xl border border-[#e5dac5] bg-white px-4 py-3 font-bold text-[#244841] transition hover:border-[#8ca99f] hover:underline"
                                >
                                  {lesson.title}
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
        )}
      </div>
    </main>
  );
}
