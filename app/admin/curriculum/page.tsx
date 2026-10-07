import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type CountryRow = {
  id: string;
  code: string;
  name_ar: string;
  is_active: boolean;
};

type CurriculumRelation =
  | {
      name_ar: string;
      code: string;
    }
  | {
      name_ar: string;
      code: string;
    }[]
  | null;

type CurriculumRow = {
  id: string;
  name_ar: string;
  academic_year: string | null;
  is_active: boolean;
  countries: CurriculumRelation;
};

type SecondaryCoverageRow = {
  country_code: string;
  country_name_ar: string;
  lesson_coverage: string | null;
  is_active: boolean;
  last_audited_date: string | null;
};

function relationOne<T>(
  value: T | T[] | null
): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value)
    ? value[0] ?? null
    : value;
}

async function countTable(
  query: PromiseLike<{
    count: number | null;
    error: {
      message: string;
    } | null;
  }>,
  label: string
) {
  const result = await query;

  if (result.error) {
    throw new Error(
      `${label}: ${result.error.message}`
    );
  }

  return result.count ?? 0;
}

export default async function CurriculumPage() {
  const supabase = await createClient();

  const [
    countriesResult,
    curriculaResult,
    gradeCount,
    unitCount,
    lessonCount,
    publishedCount,
    secondaryCoverageResult,
  ] = await Promise.all([
    supabase
      .from("countries")
      .select("id,code,name_ar,is_active")
      .order("name_ar")
      .limit(50),

    supabase
      .from("curricula")
      .select(`
        id,
        name_ar,
        academic_year,
        is_active,
        countries (
          name_ar,
          code
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100),

    countTable(
      supabase
        .from("grades")
        .select("id", { count: "estimated", head: true }),
      "grades"
    ),

    countTable(
      supabase
        .from("units")
        .select("id", { count: "estimated", head: true }),
      "units"
    ),

    countTable(
      supabase
        .from("lessons")
        .select("id", { count: "estimated", head: true }),
      "lessons"
    ),

    countTable(
      supabase
        .from("lessons")
        .select("id", { count: "estimated", head: true })
        .eq("status", "published"),
      "published lessons"
    ),

    supabase
      .from("secondary_tracks")
      .select(
        "country_code,country_name_ar,lesson_coverage,is_active,last_audited_date"
      )
      .eq("is_active", true)
      .order("country_code"),
  ]);

  if (countriesResult.error) {
    throw new Error(
      countriesResult.error.message
    );
  }

  if (curriculaResult.error) {
    throw new Error(
      curriculaResult.error.message
    );
  }

  if (secondaryCoverageResult.error) {
    throw new Error(
      secondaryCoverageResult.error.message
    );
  }

  const countries =
    (countriesResult.data ?? []) as CountryRow[];

  const curricula =
    (curriculaResult.data ?? []) as unknown as CurriculumRow[];

  const activeCountries =
    countries.filter(
      (country) => country.is_active
    ).length;

  const secondaryCoverageRows =
    (secondaryCoverageResult.data ?? []) as SecondaryCoverageRow[];

  const coverageByCountry = new Map<
    string,
    {
      name: string;
      rows: SecondaryCoverageRow[];
      lastAudited: string | null;
    }
  >();

  for (const row of secondaryCoverageRows) {
    const current =
      coverageByCountry.get(row.country_code) ?? {
        name: row.country_name_ar,
        rows: [],
        lastAudited: null,
      };

    current.rows.push(row);

    if (
      row.last_audited_date &&
      (!current.lastAudited ||
        row.last_audited_date > current.lastAudited)
    ) {
      current.lastAudited = row.last_audited_date;
    }

    coverageByCountry.set(
      row.country_code,
      current
    );
  }

  const weakCoveragePattern =
    /(partial|generic|awaiting|book-level|national-exam|legacy)/iu;

  const coverageCards =
    [...coverageByCountry.entries()]
      .map(([code, item]) => {
        const labels = item.rows.map(
          (row) =>
            String(
              row.lesson_coverage ?? ""
            ).trim()
        );

        const detailed =
          labels.length > 0 &&
          labels.every(
            (label) =>
              label.includes("detailed") &&
              !weakCoveragePattern.test(label)
          );

        return {
          code,
          name: item.name,
          tracks: item.rows.length,
          detailed,
          lastAudited: item.lastAudited,
        };
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code)
      );

  const detailedCountries =
    coverageCards.filter(
      (item) => item.detailed
    ).length;

  return (
    <main
      dir="rtl"
      className="px-4 py-7 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative">
            <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
              المصدر القياسي للمحتوى
            </span>

            <h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">
              بوابة المناهج
            </h1>

            <p className="mt-4 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e7f1ed]">
              الدولة ← السنة الدراسية ← المنهج ← المرحلة ← الصف ← الفصل
              ← اللغة العربية ← الوحدة ← الدرس. المناهج الأساسية تُحمّل
              كحزم موثقة، ولا نطلب من المعلم إنشاءها يدويًا.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="الدول المسجلة" value={countries.length} />
          <Metric label="الدول النشطة" value={activeCountries} />
          <Metric label="الصفوف" value={gradeCount} />
          <Metric label="الوحدات" value={unitCount} />
          <Metric
            label="الدروس المنشورة"
            value={publishedCount}
            note={`من ${lessonCount}`}
          />
        </section>

        <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black text-[#9a7028]">
                تدقيق صارم — مسارات الثانوية
              </p>
              <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
                حالة التغطية التفصيلية حسب الدولة
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#73695d]">
                «مدعوم» لا يعني «مكتمل». اللون الأخضر يظهر فقط عندما تكون
                كل المسارات النشطة موسومة بتغطية تفصيلية وليست عامة أو جزئية.
              </p>
            </div>

            <div className="rounded-full bg-[#eef6f2] px-4 py-2 text-sm font-black text-[#1f6a50]">
              تفصيلي: {detailedCountries}/{coverageCards.length}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coverageCards.map((item) => (
              <article
                key={item.code}
                className={`rounded-2xl border p-4 ${
                  item.detailed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-500">
                      {item.code}
                    </div>
                    <h3 className="mt-1 font-black text-slate-900">
                      {item.name}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      item.detailed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.detailed
                      ? "تفصيلي"
                      : "جزئي/عام"}
                  </span>
                </div>

                <div className="mt-3 text-xs font-bold text-slate-600">
                  {item.tracks} مسار نشط
                  {item.lastAudited
                    ? ` • آخر تدقيق: ${item.lastAudited}`
                    : ""}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_.85fr]">
          <div className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-[#9a7028]">
                  المناهج الموجودة في قاعدة البيانات
                </p>
                <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
                  الحزم والمسارات
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/curriculum/packs"
                  className="rounded-full bg-[#123f39] px-5 py-2.5 text-sm font-black text-white"
                >
                  مركز حزم المناهج
                </Link>

                <Link
                  href="/courses"
                  className="rounded-full border border-[#d3c099] bg-[#fffaf0] px-5 py-2.5 text-sm font-black text-[#6f572d]"
                >
                  معاينة بوابة الطالب
                </Link>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {curricula.map((curriculum) => {
                const country =
                  relationOne(curriculum.countries);

                return (
                  <article
                    key={curriculum.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e5d8bf] bg-white p-4"
                  >
                    <div>
                      <div className="text-xs font-black text-[#9a7028]">
                        {country?.name_ar ?? "دولة غير محددة"} •{" "}
                        {curriculum.academic_year ?? "السنة غير محددة"}
                      </div>

                      <h3 className="mt-1 font-black text-[#123f39]">
                        {curriculum.name_ar}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${
                        curriculum.is_active
                          ? "bg-[#e3f2e8] text-[#1b6748]"
                          : "bg-[#f4ecdd] text-[#806632]"
                      }`}
                    >
                      {curriculum.is_active ? "نشط" : "غير نشط"}
                    </span>
                  </article>
                );
              })}

              {curricula.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d7c49d] p-8 text-center font-bold text-[#746a5e]">
                  لم تُحمّل أي حزمة منهج بعد.
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
              <p className="text-xs font-black text-[#9a7028]">
                قاعدة ضاديوم
              </p>

              <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
                الحزمة قبل الكود
              </h2>

              <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#73695d]">
                إضافة مصر أو السعودية أو المغرب أو أي دولة لا تحتاج صفحة
                React جديدة. نضيف Curriculum Pack موثقة ثم يشغّل المحرك
                نفس الهيكل تلقائيًا.
              </p>

              <div className="mt-5 space-y-2 text-sm font-black text-[#5e554a]">
                <Rule text="لا ننسخ كتابًا محميًا كاملًا دون حق استخدام." />
                <Rule text="لا ننشر منهجًا غير موثّق لمجرد ملء القائمة." />
                <Rule text="شرح ضاديوم وأنشطته وأسئلته أصلية أو مرخصة." />
                <Rule text="المعلم يثري الدرس الموجود ولا يبني المنهج من الصفر." />
              </div>
            </section>

            <Link
              href="/admin/lessons"
              className="block rounded-[2rem] bg-[#123f39] p-6 text-white shadow-sm"
            >
              <div className="text-xs font-black text-[#f5cf7a]">
                المكتبة الحالية
              </div>
              <div className="mt-2 font-arabic-display text-2xl font-black">
                افتح إدارة الدروس
              </div>
              <div className="mt-3 text-sm font-bold text-[#e2eeea]">
                راجع المحتوى المنشور والإثراء دون إنشاء مسار منهجي يدوي.
              </div>
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
      <div className="text-xs font-black text-[#8b7040]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-[#123f39]">
        {value}
      </div>
      {note ? (
        <div className="mt-1 text-[11px] font-bold text-[#85796a]">
          {note}
        </div>
      ) : null}
    </article>
  );
}

function Rule({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex gap-2 rounded-xl bg-[#f7f0e3] p-3">
      <span className="text-[#a8782f]">
        ✓
      </span>
      <span>{text}</span>
    </div>
  );
}
