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

type CurriculumTermStatus = {
  semester: number;
  publicationStatus: string;
  detailStatus: string;
  sourceUrl: string | null;
  auditedAt: string;
};

type CurriculumStatusOption = {
  id: string;
  name: string;
  academicYear: string | null;
  terms: CurriculumTermStatus[];
};

type SecondaryTrackOption = {
  id: string;
  systemName: string;
  name: string;
  status: string;
  lessonCoverage: string;
  officialUnits: number;
  officialLessons: number;
  unclassifiedOfficialLessons: number;
  officialSemesters: number[];
  supportingLessons: number;
  terms: CurriculumTermStatus[];
};

type CatalogResponse = {
  units?: StudentCatalogUnit[];
  tracks?: SecondaryTrackOption[];
  selectedTrackId?: string | null;
  error?: string;
};

type TermStatusResponse = {
  curricula?: CurriculumStatusOption[];
  error?: string;
};

type ContinuingEducationLesson = {
  id: string;
  title: string;
  lessonType: string;
  summary: string | null;
  order: number;
  semester: number | null;
  sourcePdfUrl: string | null;
  sourcePageStart: number | null;
  sourcePageEnd: number | null;
};

type ContinuingEducationUnit = {
  id: string;
  title: string;
  description: string | null;
  semester: number | null;
  order: number;
  lessons: ContinuingEducationLesson[];
};

type ContinuingEducationResponse = {
  level?: string;
  academicYear?: string;
  units?: ContinuingEducationUnit[];
  terms?: CurriculumTermStatus[];
  lessonCount?: number;
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

const bahrainContinuingLevels = [
  "الأول محو الأمية",
  "الثاني محو الأمية",
  "الأول متابعة",
  "الثاني متابعة",
  "الأول تقوية",
  "الثاني تقوية",
] as const;

const continuingLessonTypeLabel: Record<string, string> = {
  reading: "قراءة",
  writing: "إنتاج كتابي",
  grammar: "قواعد وتراكيب",
  spelling: "إملاء وخط",
  assessment: "مراجعة وتقويم",
  listening: "استماع",
  speaking: "تحدث",
  vocabulary: "مفردات",
};

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

function isSecondaryGrade(
  countryCode: string,
  number: number | null,
): boolean {
  const value = Number(number);
  return countryCode === "SO"
    ? value >= 9
    : value >= 10;
}

function stageName(
  number: number | null,
  countryCode = "",
): string {
  const value = Number(number);

  if (value <= 6) return "الابتدائية";
  if (isSecondaryGrade(countryCode, value)) return "الثانوية";
  return "الإعدادية";
}

function semesterName(value: number): string {
  if (value === 1) return "الفصل الدراسي الأول";
  if (value === 2) return "الفصل الدراسي الثاني";
  if (value === 3) return "الفصل الدراسي الثالث";
  return `الفصل الدراسي ${value}`;
}

function trackStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "";
    case "pilot-active":
      return " — تجريبي حالي";
    case "future-after-foundation":
      return " — يبدأ بعد سنة التأسيس";
    case "legacy-no-new-intake":
      return " — مسار قديم بلا قبول جديد";
    case "transition-or-limited":
      return " — انتقالي/محدود";
    case "new-or-reorganized-2026-2027":
      return " — جديد/معاد تنظيمه";
    case "current-national-exam-evidence":
      return " — مثبت بامتحان وطني";
    default:
      return status ? ` — ${status}` : "";
  }
}


function lessonCoverageLabel(value: string): string {
  if (value === "detailed-current-semester-1") {
    return "تفاصيل الدروس الرسمية للفصل الأول مستوردة";
  }

  if (value === "current-detailed-source-nonstandard-levels") {
    return "الخطة الرسمية مفصلة، لكن مستوياتها خاصة بالتعليم المستمر وليست صفوف 10–12";
  }

  if (value === "detailed-current-s1-nonstandard-levels") {
    return "مستويات التعليم المستمر الستة ودروس الفصل الأول الحالية مستوردة تفصيليًا دون ربطها بصفوف 10–12";
  }

  if (value === "detailed-current-s1-plus-current-book-s2") {
    return "الفصل الأول الحالي مستورد تفصيليًا، ومحتوى الجزء الثاني من الكتاب الرسمي محفوظ منفصلًا عن الجدول الحالي";
  }

  if (value === "awaiting-current-official-detail") {
    return "المسار رسمي، لكن عناوين دروس العربية الحالية لم تُنشر تفصيليًا في المصدر المتاح";
  }

  if (
    value.includes("book-level") ||
    value.includes("generic") ||
    value.includes("bundle") ||
    value.includes("partial")
  ) {
    return "التغطية الرسمية الحالية موثقة جزئيًا/على مستوى الكتب أو الحزم";
  }

  return "";
}

function hasDetailedLessonCoverage(value: string): boolean {
  return value.includes("detailed-current") ||
    value === "detailed";
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
  const [continuingLevel, setContinuingLevel] = useState("");

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
                setContinuingLevel("");
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
                setContinuingLevel("");
              }}
            />
          </div>
        </section>

        {country === "BH" ? (
          <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <SelectBox
                label="برنامج خاص — التعليم المستمر"
                value={continuingLevel}
                options={[
                  ["", "التعليم النظامي حسب الصف"],
                  ...bahrainContinuingLevels.map((level) => [
                    level,
                    `التعليم المستمر — ${level}`,
                  ]),
                ]}
                onChange={setContinuingLevel}
              />
              <div className="rounded-2xl bg-[#f6f0e5] p-4 text-sm font-bold leading-7 text-[#625b51]">
                مستويات التعليم المستمر في البحرين مستقلة عن الصفوف 10–12.
                اختيار أحدها لا يغيّر رقم الصف ولا ينشئ Mapping وهميًا.
              </div>
            </div>
          </section>
        ) : null}

        {country === "BH" && continuingLevel ? (
          <BahrainContinuingEducationPanel level={continuingLevel} />
        ) : (
          <CatalogScope
            key={`${country}:${gradeNumber}`}
            country={country}
            countryName={activeCountry?.name ?? country}
            gradeNumber={gradeNumber}
          />
        )}
      </div>
    </main>
  );
}

function BahrainContinuingEducationPanel({
  level,
}: {
  level: string;
}) {
  const [semester, setSemester] = useState("1");
  const [payload, setPayload] =
    useState<ContinuingEducationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setSemester("1");
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      country: "BH",
      level,
    });

    void fetch(
      `/api/courses/continuing-education?${params.toString()}`,
      {
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const body =
          (await response.json()) as ContinuingEducationResponse;

        if (!response.ok) {
          throw new Error(
            body.error ||
              `تعذر تحميل التعليم المستمر (HTTP ${response.status}).`,
          );
        }

        return body;
      })
      .then((body) => {
        if (controller.signal.aborted) return;
        setPayload(body);
        setLoading(false);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "تعذر تحميل دروس التعليم المستمر.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, [level, reloadKey]);

  const firstSemester = semester === "1";
  const selectedTerm =
    payload?.terms?.find(
      (item) => item.semester === Number(semester),
    ) ?? null;
  const units =
    firstSemester ? payload?.units ?? [] : [];
  const visibleLessons = units.reduce(
    (sum, item) => sum + item.lessons.length,
    0,
  );

  return (
    <section className="min-w-0 space-y-5">
      <div className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black text-[#9a702a]">
              البحرين — التعليم المستمر
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#123f39]">
              {level}
            </h2>
            <p className="mt-2 max-w-3xl font-bold leading-8 text-[#625b51]">
              مستوى رسمي مستقل في Plan6، وليس الصف العاشر أو الحادي عشر
              أو الثاني عشر.
            </p>
          </div>
          <span className="rounded-full bg-[#e8f7ee] px-4 py-2 text-xs font-black text-[#245b3a]">
            {loading
              ? "جارٍ التحميل…"
              : `${payload?.lessonCount ?? 0} درسًا رسميًا مستوردًا`}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e5d8bf] bg-white p-4">
            <div className="text-xs font-black text-[#887d70]">السنة</div>
            <div className="mt-1 font-black text-[#123f39]">
              {payload?.academicYear ?? "2026-2027"}
            </div>
          </div>
          <SelectBox
            label="الفصل الدراسي"
            value={semester}
            options={[
              ["1", "الفصل الدراسي الأول"],
              ["2", "الفصل الدراسي الثاني"],
            ]}
            onChange={setSemester}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-[#e5d8bf] bg-white p-5">
          {firstSemester ? (
            <>
              <div className="inline-flex rounded-full bg-[#e8f7ee] px-3 py-1 text-xs font-black text-[#245b3a]">
                الخطة الرسمية الحالية مستوردة تفصيليًا
              </div>
              <p className="mt-3 font-bold leading-8 text-[#625b51]">
                تم استخراج عناوين هذا المستوى من Plan6 الرسمي للفصل الأول
                2026-2027 وإدخالها كدروس مقررة، مع إبقاء رقم الصف فارغًا
                لأن التعليم المستمر يستخدم مستويات غير قياسية.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-black text-[#8a3f1f]">
                {selectedTerm?.publicationStatus ===
                "not-published-as-of-audit"
                  ? "غير منشور رسميًا للسنة الحالية حتى آخر تدقيق"
                  : "لا توجد خطة حالية منشورة"}
              </div>
              <p className="mt-3 font-bold leading-8 text-[#625b51]">
                الكتب الحالية مثبتة في دليل الكتب 2026-2027، لكن لا ننسب
                أي درس إلى الفصل الثاني قبل نشر خطة 2026-2027 الرسمية.
              </p>
            </>
          )}

          {(selectedTerm?.sourceUrl ||
            (firstSemester &&
              "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf")) ? (
            <a
              href={
                selectedTerm?.sourceUrl ??
                "https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf"
              }
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-xl border border-[#cdbb96] px-4 py-2 text-sm font-black text-[#174f47] underline decoration-dotted underline-offset-4"
            >
              المصدر الرسمي لهذا الفصل
            </a>
          ) : null}
        </div>
      </div>

      {loading ? (
        <section className="rounded-[2rem] border border-[#dfcfad] bg-white p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#d9c69c] border-t-[#123f39]" />
          <p className="mt-4 font-black text-[#123f39]">
            جارٍ تحميل دروس {level}…
          </p>
        </section>
      ) : error ? (
        <section className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-center">
          <h3 className="text-xl font-black text-rose-900">
            تعذر تحميل المستوى
          </h3>
          <p className="mt-2 font-bold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-5 rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white"
          >
            إعادة المحاولة
          </button>
        </section>
      ) : firstSemester && units.length > 0 ? (
        <section className="space-y-5">
          <div className="rounded-2xl bg-[#eef6f2] px-4 py-3 text-sm font-black text-[#245b3a]">
            المعروض الآن: {visibleLessons} درسًا/بندًا رسميًا في Plan6
          </div>
          {units.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8]"
            >
              <header className="border-b border-[#eadfc9] p-5">
                <p className="text-xs font-black text-[#9a702a]">
                  الفصل الدراسي الأول
                </p>
                <h3 className="mt-1 text-xl font-black text-[#123f39]">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm font-bold leading-7 text-[#766c60]">
                    {item.description}
                  </p>
                ) : null}
              </header>

              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {item.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/lessons/${lesson.id}`}
                    className="rounded-2xl border border-[#e5d8bf] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5ecd8] font-black">
                        {lesson.order}
                      </span>
                      <span className="rounded-full bg-[#f6f0e5] px-3 py-1 text-xs font-black text-[#6f572c]">
                        {continuingLessonTypeLabel[lesson.lessonType] ??
                          lesson.lessonType}
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-black leading-7 text-[#123f39]">
                      {lesson.title}
                    </h4>
                    {lesson.sourcePageStart ? (
                      <p className="mt-3 text-xs font-bold text-[#887d70]">
                        المصدر: Plan6، الصفحات{" "}
                        {lesson.sourcePageStart}
                        {lesson.sourcePageEnd &&
                        lesson.sourcePageEnd !== lesson.sourcePageStart
                          ? `–${lesson.sourcePageEnd}`
                          : ""}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : firstSemester ? (
        <section className="rounded-[2rem] border border-[#dfcfad] bg-white p-8 text-center">
          <h3 className="text-xl font-black text-[#123f39]">
            لا توجد دروس منشورة لهذا المستوى
          </h3>
        </section>
      ) : (
        <section className="rounded-[2rem] border border-[#dfcfad] bg-white p-8 text-center">
          <h3 className="text-xl font-black text-[#123f39]">
            الفصل الثاني غير منشور رسميًا للسنة الحالية
          </h3>
          <p className="mt-2 font-bold leading-7 text-[#766c60]">
            سيظل ظاهرًا بهذه الحالة حتى تنشر وزارة التربية خطة 2026-2027.
          </p>
        </section>
      )}
    </section>
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
  const [tracks, setTracks] = useState<SecondaryTrackOption[]>([]);
  const [curriculumStatuses, setCurriculumStatuses] = useState<CurriculumStatusOption[]>([]);
  const [track, setTrack] = useState("");
  const [year, setYear] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [semester, setSemester] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams({
      country,
      grade: String(gradeNumber),
    });

    if (track) {
      params.set("track", track);
    }

    const termParams = new URLSearchParams({
      country,
      grade: String(gradeNumber),
    });

    void Promise.all([
      fetch(
        `/api/courses/catalog?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        },
      ).then(async (response) => {
        const payload = (await response.json()) as CatalogResponse;

        if (!response.ok) {
          throw new Error(
            payload.error ||
              `تعذر تحميل المناهج (HTTP ${response.status}).`,
          );
        }

        return payload;
      }),
      fetch(
        `/api/courses/term-status?${termParams.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        },
      )
        .then(async (response) => {
          if (!response.ok) {
            return { curricula: [] } as TermStatusResponse;
          }

          return (await response.json()) as TermStatusResponse;
        })
        .catch(() => ({ curricula: [] }) as TermStatusResponse),
    ])
      .then(([payload, termPayload]) => {
        if (controller.signal.aborted) return;

        setUnits(payload.units ?? []);
        setTracks(payload.tracks ?? []);
        setCurriculumStatuses(termPayload.curricula ?? []);
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
  }, [country, gradeNumber, track, reloadKey]);

  const years = [
    ...new Set([
      ...units
        .map((item) => item.curriculum.academicYear)
        .filter((value): value is string => Boolean(value)),
      ...curriculumStatuses
        .map((item) => item.academicYear)
        .filter((value): value is string => Boolean(value)),
    ]),
  ].sort().reverse();

  const selectedYear = year || years[0] || "";

  const selectedTrackOption =
    tracks.find(
      (item) => item.id === track,
    ) ?? null;

  const curricula = uniq([
    ...units
      .filter(
        (item) =>
          !selectedYear ||
          item.curriculum.academicYear === selectedYear,
      )
      .map((item) => item.curriculum),
    ...curriculumStatuses
      .filter(
        (item) =>
          !selectedYear ||
          item.academicYear === selectedYear,
      )
      .map((item) => ({
        id: item.id,
        name: item.name,
        academicYear: item.academicYear,
      })),
  ]).sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const hasSecondaryComplete =
    isSecondaryGrade(country, gradeNumber) &&
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

  const curriculumScopedUnits = units.filter(
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
  );

  const selectedCurriculumStatus =
    curriculumId &&
    curriculumId !== SECONDARY_COMPLETE_ID
      ? curriculumStatuses.find(
          (item) => item.id === curriculumId,
        ) ?? null
      : null;

  const effectiveTerms =
    selectedTrackOption?.terms?.length
      ? selectedTrackOption.terms
      : selectedCurriculumStatus?.terms ?? [];

  const semesterOptions = [
    ...new Set([
      ...curriculumScopedUnits
        .flatMap((item) =>
          item.lessons.map(
            (lesson) =>
              lesson.semester,
          ),
        )
        .filter((value): value is number =>
          Number.isInteger(value),
        ),
      ...effectiveTerms
        .map((term) => term.semester)
        .filter((value) =>
          Number.isInteger(value),
        ),
    ]),
  ].sort((a, b) => a - b);

  const selectedSemester =
    semester &&
    semesterOptions.includes(
      Number(semester),
    )
      ? Number(semester)
      : 0;

  const selectedTermStatus =
    selectedSemester
      ? effectiveTerms.find(
          (term) =>
            term.semester ===
            selectedSemester,
        ) ?? null
      : null;

  const gradeUnits = curriculumScopedUnits
    .map((item) => {
      if (!selectedSemester) {
        return item;
      }

      const keepUnclassified =
        isDadyoomCoreCurriculum(
          item.curriculum.name,
        );

      return {
        ...item,
        lessons: item.lessons.filter(
          (lesson) =>
            lesson.semester ===
              selectedSemester ||
            (
              keepUnclassified &&
              lesson.semester == null
            ),
        ),
      };
    })
    .filter(
      (item) =>
        item.lessons.length > 0,
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
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {isSecondaryGrade(country, gradeNumber) ? (
            <SelectBox
              label="المسار الثانوي"
              value={track}
              options={[
                ["", "كل المسارات الرسمية المتاحة"],
                ...tracks.map((item) => [
                  item.id,
                  `${item.name} — ${item.systemName}${trackStatusLabel(item.status)}`,
                ]),
              ]}
              onChange={(value) => {
                setTrack(value);
                setCurriculum("");
                setSemester("");
                setUnit("");
              }}
            />
          ) : null}

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
              setSemester("");
              setUnit("");
            }}
          />

          <SelectBox
            label={
              isSecondaryGrade(country, gradeNumber)
                ? "المحتوى / المقرر"
                : "المنهج"
            }
            value={curriculumId}
            options={
              curricula.length
                ? [
                    ...(hasSecondaryComplete
                      ? [[
                          SECONDARY_COMPLETE_ID,
                          "كل المحتوى المتاح حاليًا — الرسمي الموثق + دروس ضاديوم الداعمة",
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
              setSemester("");
              setUnit("");
            }}
          />

          <SelectBox
            label="الفصل الدراسي"
            value={selectedSemester ? String(selectedSemester) : ""}
            options={[
              ["", "كل الفصول المتاحة"],
              ...semesterOptions.map((value) => {
                const term =
                  effectiveTerms.find(
                    (item) =>
                      item.semester === value,
                  );

                const suffix =
                  term?.publicationStatus ===
                  "not-published-as-of-audit"
                    ? " — غير منشور رسميًا حتى آخر مراجعة"
                    : term?.detailStatus ===
                        "published-pending-extraction"
                      ? " — منشور وجارٍ استخراج التفاصيل"
                      : "";

                return [
                  String(value),
                  `${semesterName(value)}${suffix}`,
                ];
              }),
            ]}
            onChange={(value) => {
              setSemester(value);
              setUnit("");
            }}
          />

          <SelectBox
            label="الوحدة / المقرر"
            value={unit}
            options={[
              ["", "كل الوحدات / المقررات"],
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
            المرحلة {stageName(gradeNumber, country)}
          </span>
          <span className="rounded-full bg-[#eef4f0] px-3 py-2">
            {gradeName(gradeNumber)}
          </span>
          {track ? (
            <span className="rounded-full bg-[#fff2d5] px-3 py-2">
              {selectedTrackOption?.name ?? "المسار المختار"}
              {selectedTrackOption
                ? trackStatusLabel(selectedTrackOption.status)
                : ""}
            </span>
          ) : null}
          {selectedSemester ? (
            <span className="rounded-full bg-[#e8f3ff] px-3 py-2">
              {semesterName(selectedSemester)}
            </span>
          ) : null}
          {selectedTermStatus?.publicationStatus ===
          "not-published-as-of-audit" ? (
            <span className="rounded-full bg-[#fff0e8] px-3 py-2 text-[#8a3f1f]">
              هذا الفصل غير منشور رسميًا للسنة الحالية حتى {selectedTermStatus.auditedAt}
            </span>
          ) : selectedTermStatus?.detailStatus ===
            "published-pending-extraction" ? (
            <span className="rounded-full bg-[#fff4df] px-3 py-2">
              الخطة الرسمية منشورة — تفاصيل الدروس قيد الاستخراج الموثق
            </span>
          ) : selectedTermStatus?.detailStatus ===
            "book-content-pending-extraction" ? (
            <span className="rounded-full bg-[#fff4df] px-3 py-2">
              دليل الكتاب الرسمي منشور — محتوى الكتاب قيد الاستخراج الكامل
            </span>
          ) : selectedTermStatus?.detailStatus ===
            "detailed-imported" ? (
            <span className="rounded-full bg-[#e8f7ee] px-3 py-2 text-[#245b3a]">
              تم استيراد تفاصيل هذا الفصل من الخطة الرسمية
            </span>
          ) : selectedTermStatus?.detailStatus ===
            "partial-imported" ? (
            <span className="rounded-full bg-[#fff4df] px-3 py-2">
              تم استيراد الجزء الرسمي المتاح لهذا الفصل
            </span>
          ) : null}
          {selectedTermStatus?.sourceUrl ? (
            <a
              href={selectedTermStatus.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#f3ecff] px-3 py-2 text-[#523b79] underline decoration-dotted underline-offset-4"
            >
              المصدر الرسمي لهذا الفصل
            </a>
          ) : null}
          {selectedTrackOption ? (
            <>
              <span className="rounded-full bg-[#e8f3ff] px-3 py-2">
                {selectedTrackOption.officialLessons}{" "}
                {hasDetailedLessonCoverage(selectedTrackOption.lessonCoverage)
                  ? "درسًا رسميًا موثقًا للمسار"
                  : "عقدة/درسًا رسميًا موثقًا للمسار"}
              </span>
              {lessonCoverageLabel(selectedTrackOption.lessonCoverage) ? (
                <span className="rounded-full bg-[#fff4df] px-3 py-2">
                  {lessonCoverageLabel(selectedTrackOption.lessonCoverage)}
                </span>
              ) : null}
              {selectedTrackOption.officialSemesters.length ? (
                <span className="rounded-full bg-[#eef9ef] px-3 py-2">
                  الفصول المصنفة:{" "}
                  {selectedTrackOption.officialSemesters
                    .map(semesterName)
                    .join("، ")}
                </span>
              ) : (
                <span className="rounded-full bg-[#fff4df] px-3 py-2">
                  الفصل غير محدد في المصدر الحالي
                </span>
              )}
            </>
          ) : null}
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
              {curricula.length} حزم محتوى متاحة
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:max-w-md">
          <SmallMetric value={String(shown.length)} label="وحدات" />
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
            {selectedTermStatus?.publicationStatus ===
            "not-published-as-of-audit"
              ? "غير منشور رسميًا للسنة الحالية حتى آخر مراجعة"
              : selectedTermStatus?.detailStatus ===
                  "published-pending-extraction"
                ? "الخطة الرسمية منشورة — تفاصيل الدروس قيد الاستخراج الموثق"
                : "لا توجد دروس منشورة لهذا الاختيار حاليًا"}
          </h2>
          <p className="mt-2 font-bold leading-7 text-[#766c60]">
            {selectedTermStatus?.detailStatus ===
            "book-content-pending-extraction"
              ? "دليل الكتاب الرسمي موجود، ونعمل على استخراج محتوى الكتاب كاملًا دون اختلاق عناوين أو نسبته إلى الخطة قبل نشرها."
              : selectedTermStatus?.publicationStatus ===
                  "not-published-as-of-audit"
                ? "سيظل هذا الفصل ظاهرًا بحالته الحقيقية، ولن ننسب إليه دروسًا على أنها مقررة قبل نشر المصدر الرسمي."
                : "اختر صفًا أو منهجًا آخر من الأعلى."}
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
                        : item.lessons.every(
                            (lesson) =>
                              lesson.officialContentScope ===
                              "official-book-unscheduled",
                          )
                          ? "محتوى كتاب رسمي — غير مجدول حاليًا"
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

                    {lesson.officialContentScope ===
                    "official-book-unscheduled" ? (
                      <span className="mt-2 inline-flex rounded-full bg-[#fff4df] px-2.5 py-1 text-[10px] font-black text-[#7d5b1d]">
                        محتوى كتاب رسمي — غير مصنف كمقرر حاليًا
                      </span>
                    ) : lesson.officialContentScope ===
                      "plan-scheduled" ? (
                      <span className="mt-2 inline-flex rounded-full bg-[#e8f7ee] px-2.5 py-1 text-[10px] font-black text-[#245b3a]">
                        مقرر في الخطة الرسمية الحالية
                      </span>
                    ) : null}

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
