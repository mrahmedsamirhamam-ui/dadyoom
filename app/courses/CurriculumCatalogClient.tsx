"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  StudentCatalogUnit,
} from "@/services/lessons/student-curriculum-catalog";

type Props = {
  units: StudentCatalogUnit[];
};

const diff = {
  beginner: "تمهيدي",
  intermediate: "متوسط",
  advanced: "متقدم",
} as const;

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
};

function uniq<T extends { id: string }>(
  items: T[],
): T[] {
  return [
    ...new Map(
      items.map((item) => [
        item.id,
        item,
      ]),
    ).values(),
  ];
}

function gradeName(
  number: number | null,
  fallback: string,
): string {
  return (
    gradeNames[
      Number(number)
    ] ?? fallback
  );
}

function stageName(
  number: number | null,
): string {
  const value = Number(number);

  if (value <= 6) {
    return "الابتدائية";
  }

  if (value <= 9) {
    return "الإعدادية";
  }

  return "الثانوية";
}

function curriculumName(
  name: string,
): string {
  return name
    .replace(
      /^اللغة العربية\s*[—-]\s*/,
      "",
    )
    .replace(
      /\s*[—-]\s*الفصل الأول$/,
      "",
    )
    .trim();
}

export default function CurriculumCatalogClient({
  units,
}: Props) {
  const [
    country,
    setCountry,
  ] = useState("");

  const [
    year,
    setYear,
  ] = useState("");

  const [
    grade,
    setGrade,
  ] = useState("");

  const [
    curriculum,
    setCurriculum,
  ] = useState("");

  const [
    unit,
    setUnit,
  ] = useState("");

  /*
   * Intentionally no useMemo here.
   * React Compiler in this project enforces preserve-manual-memoization;
   * these catalog arrays are small enough to derive directly and this
   * avoids unstable/manual memo dependencies.
   */
  const countries = uniq(
    units.map(
      (item) => item.country,
    ),
  ).sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        "ar",
      ),
  );

  const countryId =
    country ||
    countries[0]?.id ||
    "";

  const years = [
    ...new Set(
      units
        .filter(
          (item) =>
            item.country.id ===
            countryId,
        )
        .map(
          (item) =>
            item.curriculum
              .academicYear,
        )
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),
    ),
  ].sort().reverse();

  const selectedYear =
    year ||
    years[0] ||
    "";

  /*
   * Grade comes BEFORE curriculum/track.
   * This is the key fix that keeps Grade 10-12 visible.
   */
  const grades = uniq(
    units
      .filter(
        (item) =>
          item.country.id ===
            countryId &&
          (!selectedYear ||
            item.curriculum
              .academicYear ===
              selectedYear),
      )
      .map(
        (item) =>
          item.grade,
      ),
  ).sort(
    (a, b) =>
      Number(
        a.number ?? 999,
      ) -
      Number(
        b.number ?? 999,
      ),
  );

  const selectedGradeId =
    grades.some(
      (item) =>
        item.id === grade,
    )
      ? grade
      : grades[0]?.id ?? "";

  const activeGrade =
    grades.find(
      (item) =>
        item.id ===
        selectedGradeId,
    );

  const gradeNumber =
    activeGrade?.number ??
    null;

  const curricula = uniq(
    units
      .filter(
        (item) =>
          item.country.id ===
            countryId &&
          (!selectedYear ||
            item.curriculum
              .academicYear ===
              selectedYear) &&
          Number(
            item.grade.number,
          ) ===
            Number(
              gradeNumber,
            ),
      )
      .map(
        (item) =>
          item.curriculum,
      ),
  ).sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        "ar",
      ),
  );

  const curriculumId =
    curricula.some(
      (item) =>
        item.id ===
        curriculum,
    )
      ? curriculum
      : curricula[0]?.id ?? "";

  const gradeUnits = units
    .filter(
      (item) =>
        item.country.id ===
          countryId &&
        (!selectedYear ||
          item.curriculum
            .academicYear ===
            selectedYear) &&
        Number(
          item.grade.number,
        ) ===
          Number(
            gradeNumber,
          ) &&
        item.curriculum.id ===
          curriculumId,
    )
    .sort(
      (a, b) =>
        a.order - b.order,
    );

  const shown =
    unit
      ? gradeUnits.filter(
          (item) =>
            item.id === unit,
        )
      : gradeUnits;

  const total =
    shown.reduce(
      (sum, item) =>
        sum +
        item.lessons.length,
      0,
    );

  const done =
    shown.reduce(
      (sum, item) =>
        sum +
        item.lessons.filter(
          (lesson) =>
            lesson.completed,
        ).length,
      0,
    );

  const currentTrackLessonCount =
    gradeUnits.reduce(
      (sum, item) =>
        sum +
        item.lessons.length,
      0,
    );

  return (
    <main
      dir="rtl"
      className="min-h-screen w-full min-w-0 overflow-x-hidden px-3 py-5 sm:px-5"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1500px] space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-[#c9b47c] bg-[#123f39] p-5 text-white shadow-xl sm:p-8">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black text-[#ffe7ae]">
                بوابة المناهج
              </div>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                اختر صفك ثم المسار
              </h1>

              <p className="mt-2 leading-8 text-[#e9f3ef]">
                اعرض الصف والمسار، ثم تصفّح كل الدروس المنشورة التي تم التحقق منها لهذا المنهج.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric
                value={String(
                  shown.length,
                )}
                label="مجموعات"
              />

              <Metric
                value={String(
                  total,
                )}
                label="دروس"
              />

              <Metric
                value={String(
                  done,
                )}
                label="مكتملة"
              />
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-4 sm:p-6">
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SelectBox
              label="الدولة"
              value={countryId}
              options={countries.map(
                (item) => [
                  item.id,
                  item.name,
                ],
              )}
              onChange={(value) => {
                setCountry(value);
                setYear("");
                setGrade("");
                setCurriculum("");
                setUnit("");
              }}
            />

            <SelectBox
              label="السنة"
              value={selectedYear}
              options={years.map(
                (item) => [
                  item,
                  item,
                ],
              )}
              onChange={(value) => {
                setYear(value);
                setGrade("");
                setCurriculum("");
                setUnit("");
              }}
            />

            <SelectBox
              label="الصف"
              value={selectedGradeId}
              options={grades.map(
                (item) => [
                  item.id,
                  gradeName(
                    item.number,
                    item.name,
                  ),
                ],
              )}
              onChange={(value) => {
                setGrade(value);
                setCurriculum("");
                setUnit("");
              }}
            />

            <SelectBox
              label={
                Number(
                  gradeNumber ?? 0,
                ) >= 10
                  ? "المسار الثانوي"
                  : "المنهج"
              }
              value={curriculumId}
              options={curricula.map(
                (item) => [
                  item.id,
                  curriculumName(
                    item.name,
                  ),
                ],
              )}
              onChange={(value) => {
                setCurriculum(
                  value,
                );
                setUnit("");
              }}
            />

            <SelectBox
              label="المجموعة"
              value={unit}
              options={[
                [
                  "",
                  "كل المجموعات",
                ],
                ...gradeUnits.map(
                  (item) => [
                    item.id,
                    item.title,
                  ],
                ),
              ]}
              onChange={setUnit}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#6f572c]">
            <span className="rounded-full bg-[#fff2d5] px-3 py-2">
              المرحلة{" "}
              {stageName(
                gradeNumber,
              )}
            </span>

            <span className="rounded-full bg-[#eef4f0] px-3 py-2">
              {gradeName(
                gradeNumber,
                activeGrade?.name ??
                  "الصف",
              )}
            </span>

            <span className="rounded-full bg-[#eef4f0] px-3 py-2">
              {
                currentTrackLessonCount
              }{" "}
              درسًا في المسار
            </span>

            {curricula.length >
            1 ? (
              <span className="rounded-full bg-[#e8f3ff] px-3 py-2">
                {
                  curricula.length
                }{" "}
                مسارات متاحة
              </span>
            ) : null}
          </div>
        </section>

        <section className="min-w-0 space-y-5">
          {shown.map(
            (item) => (
              <article
                key={item.id}
                className="min-w-0 overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8]"
              >
                <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[#eadfc9] p-5">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-[#9a702a]">
                      {gradeName(
                        item.grade
                          .number,
                        item.grade.name,
                      )}
                    </p>

                    <h2 className="break-words text-xl font-black text-[#123f39]">
                      {item.title}
                    </h2>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-black">
                    {
                      item.lessons
                        .length
                    }{" "}
                    درسًا
                  </span>
                </header>

                <div className="grid min-w-0 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                  {item.lessons.map(
                    (lesson) => (
                      <Link
                        key={lesson.id}
                        href={`/lessons/${lesson.id}`}
                        className="min-w-0 rounded-2xl border border-[#e5d8bf] bg-white p-4 hover:shadow-md"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5ecd8] font-black">
                            {lesson.completed
                              ? "✓"
                              : lesson.order}
                          </span>

                          <span className="rounded-full bg-[#f6f0e5] px-3 py-1 text-xs font-black">
                            {
                              diff[
                                lesson
                                  .difficulty
                              ]
                            }
                          </span>
                        </div>

                        <h3 className="mt-3 break-words text-lg font-black leading-8">
                          {
                            lesson.title
                          }
                        </h3>

                        <p className="mt-2 line-clamp-2 break-words text-sm leading-7 text-[#766c60]">
                          {lesson.objective ??
                            "درس عربي تفاعلي ضمن مسارك."}
                        </p>

                        <div className="mt-3 flex justify-between border-t pt-3 text-xs font-black text-[#887d70]">
                          <span>
                            ⏱{" "}
                            {
                              lesson.estimatedMinutes
                            }{" "}
                            دقيقة
                          </span>

                          <span>
                            ✦{" "}
                            {
                              lesson.points
                            }{" "}
                            نقطة
                          </span>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              </article>
            ),
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-[70px] rounded-2xl bg-white/10 px-3 py-3">
      <b className="text-xl text-[#f5cf7a]">
        {value}
      </b>

      <div className="text-[10px]">
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
  onChange: (
    value: string,
  ) => void;
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
          onChange(
            event.target.value,
          )
        }
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={
                optionValue ||
                `${label}-all`
              }
              value={
                optionValue
              }
            >
              {optionLabel}
            </option>
          ),
        )}
      </select>
    </label>
  );
}
