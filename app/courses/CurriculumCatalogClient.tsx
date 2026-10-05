"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type {
  StudentCatalogUnit,
} from "@/services/lessons/student-curriculum-catalog";

type CountryOption = {
  code: string;
  name: string;
  maxGrade: number;
};

type Props = {
  countries: CountryOption[];
};

type CatalogResponse = {
  units?: StudentCatalogUnit[];
  error?: string;
};

const diff = {
  beginner: "تمهيدي",
  intermediate: "متوسط",
  advanced: "متقدم",
} as const;

const SECONDARY_COMPLETE_ID =
  "__secondary_complete__";

function isDadyoomCoreCurriculum(
  name: string,
): boolean {
  return name.includes(
    "المسار العربي الأساسي لضاديوم",
  );
}

const gradeNames: Record<number, string> = {
  1: "الصف الأول الابتدائي",
  2: "الصف الثاني الابتدائي",
  3: "الصف الثالث الابتدائي",
  4: "الصف الرابع الابتدائي",
  5: "الصف الخامس الابتدائي",
  6: "الصف السادس الابتدائي",
  7: "الصف الأول الإعدادي",
  8: "الصف الثاني الإعدادي",
  9: "الصف الثالث الإعدادي",
  10: "الصف الأول الثانوي",
  11: "الصف الثاني الثانوي",
  12: "الصف الثالث الثانوي",
  13: "المستوى الثالث عشر",
};

function uniq<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function gradeName(
  number: number | null,
  fallback = "",
  countryCode = "",
): string {
  const value = Number(number);

  if (value === 13) {
    if (countryCode === "TN") {
      return "السنة الرابعة ثانوي";
    }

    if (countryCode === "MR") {
      return "السنة السابعة ثانوي";
    }

    if (fallback) {
      return fallback.replace(
        /\s*—\s*مسار ضاديوم$/u,
        "",
      );
    }
  }

  return (
    gradeNames[value] ??
    (fallback || `المستوى ${number ?? ""}`)
  );
}

function stageName(number: number | null): string {
  const value = Number(number);

  if (value <= 6) return "الابتدائية";
  if (value <= 9) return "الإعدادية";
  return "الثانوية";
}

function curriculumName(name: string): string {
  return name
    .replace(/^اللغة العربية\s*[—-]\s*/u, "")
    .replace(/\s*[—-]\s*الفصل الأول$/u, "")
    .trim();
}

export default function CurriculumCatalogClient({
  countries,
}: Props) {
  const initialCountry =
    countries.find((item) => item.code === "BH") ??
    countries[0];

  const [country, setCountry] = useState(
    initialCountry?.code ?? "BH",
  );
  const [gradeNumber, setGradeNumber] = useState(1);

  const activeCountry =
    countries.find((item) => item.code === country) ??
    initialCountry;

  const gradeOptions = Array.from(
    { length: activeCountry?.maxGrade ?? 12 },
    (_, index) => index + 1,
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen w-full min-w-0 overflow-x-hidden px-3 py-5 sm:px-5"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-5">
        <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffaf0] p-5 sm:p-8">
          <p className="text-sm font-black text-[#a7772f]">
            بوابة المناهج العربية
          </p>
          <h1 className="mt-2 font-arabic-display text-3xl font-black leading-[1.45] text-[#123f39] sm:text-4xl">
            تعلّم من موقعك الحقيقي في المنهج، ثم قوِّ المهارة
          </h1>
          <div className="mt-5 max-w-5xl space-y-4 font-arabic-reading leading-8 text-[#625b51]">
            <p>
              تغطي ضاديوم الدول العربية عبر مسار أساسي موحد للمهارات، مع طبقات
              وطنية تربط الصفوف والكتب والمجالات بالمصادر الرسمية المتاحة. عندما
              يتوفر فهرس حكومي واضح نستخدم عناوينه كبنية مرجعية، وعندما يثبت المصدر
              كتابًا أو مجالًا فقط نحافظ على المطابقة عند هذا المستوى ولا نختلق
              عناوين غير منشورة.
            </p>
            <p>
              في المرحلة الثانوية قد ترى «المطابقة الوطنية الموثقة» إلى جانب
              «دروس ضاديوم الداعمة». الأولى توضح ما أمكن التحقق منه من المصدر
              الوطني، والثانية تقدم شرحًا وأسئلة وأنشطة أصلية في القراءة والكتابة
              والاستماع والتحدث والنحو والمفردات لتقوية المهارات حول المنهج.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e1d4ba] bg-white p-4">
              <div className="text-2xl font-black text-[#123f39]">22</div>
              <div className="mt-1 text-sm font-bold text-[#6c6257]">دولة عربية ضمن التغطية</div>
            </div>
            <div className="rounded-2xl border border-[#e1d4ba] bg-white p-4">
              <div className="text-2xl font-black text-[#123f39]">1–12+</div>
              <div className="mt-1 text-sm font-bold text-[#6c6257]">صفوف ومستويات بحسب الدولة</div>
            </div>
            <div className="rounded-2xl border border-[#e1d4ba] bg-white p-4">
              <div className="text-2xl font-black text-[#123f39]">4</div>
              <div className="mt-1 text-sm font-bold text-[#6c6257]">مهارات لغوية مترابطة</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            <Link href="/learn-arabic" className="rounded-xl bg-[#123f39] px-4 py-2.5 text-white">
              اقرأ دليل تعلم العربية
            </Link>
            <Link href="/about" className="rounded-xl border border-[#cdbb96] px-4 py-2.5 text-[#123f39]">
              كيف نبني المطابقة؟
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#c9b47c] bg-[#123f39] p-5 text-white shadow-xl sm:p-8">
          <div className="min-w-0">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black text-[#ffe7ae]">
              بوابة المناهج
            </div>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              اختر الدولة والصف ثم المسار
            </h1>

            <p className="mt-2 max-w-3xl leading-8 text-[#e9f3ef]">
              يحمل ضاديوم الصف الذي اخترته فقط بدل تحميل آلاف الدروس دفعة
              واحدة، لتبقى البوابة أسرع وأكثر استقرارًا.
            </p>
          </div>
        </section>

        <section className="min-w-0 rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-4 sm:p-6">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <SelectBox
              label="الدولة"
              value={country}
              options={countries.map((item) => [
                item.code,
                item.name,
              ])}
              onChange={(value) => {
                setCountry(value);
                setGradeNumber(1);
              }}
            />

            <SelectBox
              label="الصف"
              value={String(gradeNumber)}
              options={gradeOptions.map((value) => [
                String(value),
                gradeName(
                  value,
                  "",
                  country,
                ),
              ])}
              onChange={(value) => {
                setGradeNumber(Number(value));
              }}
            />
          </div>
        </section>

        <CatalogScope
          key={`${country}:${gradeNumber}`}
          country={country}
          countryName={activeCountry?.name ?? country}
          gradeNumber={gradeNumber}
        />
      </div>
    </main>
  );
}

function CatalogScope({
  country,
  countryName,
  gradeNumber,
}: {
  country: string;
  countryName: string;
  gradeNumber: number;
}) {
  const [units, setUnits] = useState<StudentCatalogUnit[]>([]);
  const [year, setYear] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetch(
      `/api/courses/catalog?country=${encodeURIComponent(country)}&grade=${gradeNumber}`,
      {
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const payload = (await response.json()) as CatalogResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ||
              `تعذر تحميل المناهج (HTTP ${response.status}).`,
          );
        }

        return payload;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;

        setUnits(payload.units ?? []);
        setError("");
        setLoading(false);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "تعذر تحميل دروس هذا الصف الآن.",
        );
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [country, gradeNumber, reloadKey]);

  const years = [
    ...new Set(
      units
        .map((item) => item.curriculum.academicYear)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort().reverse();

  const selectedYear = year || years[0] || "";

  const curricula = uniq(
    units
      .filter(
        (item) =>
          !selectedYear ||
          item.curriculum.academicYear === selectedYear,
      )
      .map((item) => item.curriculum),
  ).sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const hasSecondaryComplete =
    gradeNumber >= 10 &&
    curricula.length > 1;

  const curriculumId =
    curriculum ===
      SECONDARY_COMPLETE_ID &&
    hasSecondaryComplete
      ? SECONDARY_COMPLETE_ID
      : curricula.some(
            (item) =>
              item.id ===
              curriculum,
          )
        ? curriculum
        : hasSecondaryComplete
          ? SECONDARY_COMPLETE_ID
          : curricula[0]?.id ?? "";

  const gradeUnits = units
    .filter(
      (item) =>
        (!selectedYear ||
          item.curriculum.academicYear === selectedYear) &&
        (
          curriculumId ===
            SECONDARY_COMPLETE_ID ||
          !curriculumId ||
          item.curriculum.id ===
            curriculumId
        ),
    )
    .sort((a, b) => {
      if (
        curriculumId ===
        SECONDARY_COMPLETE_ID
      ) {
        const aCore =
          isDadyoomCoreCurriculum(
            a.curriculum.name,
          )
            ? 1
            : 0;

        const bCore =
          isDadyoomCoreCurriculum(
            b.curriculum.name,
          )
            ? 1
            : 0;

        if (aCore !== bCore) {
          return aCore - bCore;
        }
      }

      return a.order - b.order;
    });

  const shown = unit
    ? gradeUnits.filter((item) => item.id === unit)
    : gradeUnits;

  const total = shown.reduce(
    (sum, item) => sum + item.lessons.length,
    0,
  );

  const done = shown.reduce(
    (sum, item) =>
      sum +
      item.lessons.filter((lesson) => lesson.completed).length,
    0,
  );

  const currentTrackLessonCount = gradeUnits.reduce(
    (sum, item) => sum + item.lessons.length,
    0,
  );

  const officialLessonCount =
    gradeUnits
      .filter(
        (item) =>
          !isDadyoomCoreCurriculum(
            item.curriculum.name,
          ),
      )
      .reduce(
        (sum, item) =>
          sum +
          item.lessons.length,
        0,
      );

  const supportingLessonCount =
    gradeUnits
      .filter(
        (item) =>
          isDadyoomCoreCurriculum(
            item.curriculum.name,
          ),
      )
      .reduce(
        (sum, item) =>
          sum +
          item.lessons.length,
        0,
      );

  return (
    <>
      <section className="min-w-0 rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-4 sm:p-6">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectBox
            label="السنة"
            value={selectedYear}
            options={
              years.length
                ? years.map((item) => [item, item])
                : [["", "—"]]
            }
            onChange={(value) => {
              setYear(value);
              setCurriculum("");
              setUnit("");
            }}
          />

          <SelectBox
            label={
              gradeNumber >= 10
                ? "عرض المرحلة الثانوية"
                : "المنهج"
            }
            value={curriculumId}
            options={
              curricula.length
                ? [
                    ...(hasSecondaryComplete
                      ? [[
                          SECONDARY_COMPLETE_ID,
                          "المسار الكامل — الرسمي + دروس ضاديوم الداعمة",
                        ]]
                      : []),
                    ...curricula.map((item) => [
                      item.id,
                      curriculumName(item.name),
                    ]),
                  ]
                : [["", "—"]]
            }
            onChange={(value) => {
              setCurriculum(value);
              setUnit("");
            }}
          />

          <SelectBox
            label="المجموعة"
            value={unit}
            options={[
              ["", "كل المجموعات"],
              ...gradeUnits.map((item) => [
                item.id,
                item.title,
              ]),
            ]}
            onChange={setUnit}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#6f572c]">
          <span className="rounded-full bg-[#fff2d5] px-3 py-2">
            {countryName}
          </span>
          <span className="rounded-full bg-[#eef4f0] px-3 py-2">
            المرحلة {stageName(gradeNumber)}
          </span>
          <span className="rounded-full bg-[#eef4f0] px-3 py-2">
            {gradeName(gradeNumber)}
          </span>
          <span className="rounded-full bg-[#eef4f0] px-3 py-2">
            {currentTrackLessonCount} درسًا في المسار
          </span>
          {curriculumId ===
          SECONDARY_COMPLETE_ID ? (
            <>
              <span className="rounded-full bg-[#e8f3ff] px-3 py-2">
                {officialLessonCount} عقدة/درس رسمي موثق
              </span>
              <span className="rounded-full bg-[#eef9ef] px-3 py-2">
                {supportingLessonCount} درس ضاديوم داعم
              </span>
            </>
          ) : null}
          {curricula.length > 1 ? (
            <span className="rounded-full bg-[#e8f3ff] px-3 py-2">
              {curricula.length} مسارات متاحة
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-md">
          <SmallMetric value={String(shown.length)} label="مجموعات" />
          <SmallMetric value={String(total)} label="دروس" />
          <SmallMetric value={String(done)} label="مكتملة" />
        </div>
      </section>

      {loading ? (
        <section className="rounded-[2rem] border border-[#dfcfad] bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#d9c69c] border-t-[#123f39]" />
          <p className="mt-4 font-black text-[#123f39]">
            جارٍ تحميل هذا الصف فقط…
          </p>
        </section>
      ) : error ? (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center">
          <h2 className="text-xl font-black text-rose-900">
            تعذر تحميل هذا الصف
          </h2>
          <p className="mt-2 font-bold leading-7 text-rose-800">
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setReloadKey((value) => value + 1);
            }}
            className="mt-5 rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white"
          >
            إعادة المحاولة
          </button>
        </section>
      ) : shown.length === 0 ? (
        <section className="rounded-[2rem] border border-[#dfcfad] bg-white p-8 text-center">
          <h2 className="text-xl font-black text-[#123f39]">
            لا توجد دروس منشورة لهذا الاختيار حاليًا
          </h2>
          <p className="mt-2 font-bold text-[#766c60]">
            اختر صفًا آخر أو دولة أخرى من الأعلى.
          </p>
        </section>
      ) : (
        <section className="min-w-0 space-y-5">
          {shown.map((item) => (
            <article
              key={item.id}
              className="min-w-0 overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8]"
            >
              <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[#eadfc9] p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black text-[#9a702a]">
                      {gradeName(
                        item.grade.number,
                        item.grade.name,
                        item.country.code,
                      )}
                    </p>
                    <span className="rounded-full bg-[#f6f0e5] px-2.5 py-1 text-[10px] font-black text-[#6f572c]">
                      {isDadyoomCoreCurriculum(
                        item.curriculum.name,
                      )
                        ? "دروس ضاديوم الداعمة"
                        : "المطابقة الوطنية الموثقة"}
                    </span>
                  </div>
                  <h2 className="break-words text-xl font-black text-[#123f39]">
                    {item.title}
                  </h2>
                </div>

                <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black">
                  {item.lessons.length} درسًا
                </span>
              </header>

              <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {item.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="min-w-0 rounded-2xl border border-[#e5d8bf] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5ecd8] font-black">
                        {lesson.completed
                          ? "✓"
                          : lesson.order}
                      </span>

                      <span className="rounded-full bg-[#f6f0e5] px-3 py-1 text-xs font-black">
                        {diff[lesson.difficulty]}
                      </span>
                    </div>

                    <h3 className="mt-3 break-words text-lg font-black leading-8">
                      {lesson.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 break-words text-sm leading-7 text-[#766c60]">
                      {lesson.objective ??
                        "درس عربي تفاعلي ضمن مسارك."}
                    </p>

                    <div className="mt-3 flex justify-between border-t pt-3 text-xs font-black text-[#887d70]">
                      <span>
                        ⏱ {lesson.estimatedMinutes} دقيقة
                      </span>
                      <span>✦ {lesson.points} نقطة</span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function SmallMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-[#f6f0e5] px-3 py-2">
      <b className="text-lg text-[#123f39]">{value}</b>
      <div className="text-[10px] font-black text-[#766c60]">
        {label}
      </div>
    </div>
  );
}

function SelectBox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-black">
        {label}
      </span>

      <select
        className="w-full min-w-0 max-w-full rounded-2xl border border-[#dac9a7] bg-white px-3 py-3 font-black"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        {options.map(
          ([optionValue, optionLabel], index) => (
            <option
              key={
                optionValue ||
                `${label}-${index}`
              }
              value={optionValue}
            >
              {optionLabel}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
