"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  UnitCatalog,
} from "@/services/lessons/catalog";

const difficultyLabels = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
} as const;

type Props = {
  units: UnitCatalog[];
};

function uniqueById<T extends { id: string }>(
  items: T[]
): T[] {
  const map = new Map<string, T>();

  for (const item of items) {
    map.set(item.id, item);
  }

  return Array.from(map.values());
}

export default function CurriculumCatalogClient({
  units,
}: Props) {
  /*
   * CANONICAL_CURRICULUM_SELECTOR_V1
   *
   * Country -> Curriculum -> Grade -> Unit -> Lesson
   */

  const [countryId, setCountryId] =
    useState("");

  const [curriculumId, setCurriculumId] =
    useState("");

  const [gradeId, setGradeId] =
    useState("");

  const [unitId, setUnitId] =
    useState("");


  const countries =
    useMemo(
      () =>
        uniqueById(
          units.map((unit) => unit.country)
        ).sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ar"
          )
        ),
      [units]
    );


  const curricula =
    useMemo(
      () =>
        uniqueById(
          units
            .filter(
              (unit) =>
                unit.country.id ===
                countryId
            )
            .map(
              (unit) =>
                unit.curriculum
            )
        ).sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ar"
          )
        ),
      [units, countryId]
    );


  const grades =
    useMemo(
      () =>
        uniqueById(
          units
            .filter(
              (unit) =>
                unit.country.id ===
                  countryId &&
                unit.curriculum.id ===
                  curriculumId
            )
            .map(
              (unit) =>
                unit.grade
            )
        ).sort(
          (a, b) =>
            Number(
              a.number ?? 999
            ) -
            Number(
              b.number ?? 999
            )
        ),
      [
        units,
        countryId,
        curriculumId,
      ]
    );


  const gradeUnits =
    useMemo(
      () =>
        units
          .filter(
            (unit) =>
              unit.country.id ===
                countryId &&
              unit.curriculum.id ===
                curriculumId &&
              unit.grade.id ===
                gradeId
          )
          .sort(
            (a, b) =>
              a.order -
              b.order
          ),
      [
        units,
        countryId,
        curriculumId,
        gradeId,
      ]
    );


  const selectedUnit =
    useMemo(
      () =>
        unitId
          ? gradeUnits.find(
              (unit) =>
                unit.id === unitId
            ) ?? null
          : null,
      [gradeUnits, unitId]
    );


  const scopeUnits =
    useMemo(
      () => {
        if (selectedUnit) {
          return [selectedUnit];
        }

        if (gradeId) {
          return gradeUnits;
        }

        if (curriculumId) {
          return units.filter(
            (unit) =>
              unit.country.id ===
                countryId &&
              unit.curriculum.id ===
                curriculumId
          );
        }

        if (countryId) {
          return units.filter(
            (unit) =>
              unit.country.id ===
              countryId
          );
        }

        return units;
      },
      [
        units,
        countryId,
        curriculumId,
        gradeId,
        gradeUnits,
        selectedUnit,
      ]
    );


  const totalLessons =
    scopeUnits.reduce(
      (total, unit) =>
        total +
        unit.lessons.length,
      0
    );


  const completedLessons =
    scopeUnits.reduce(
      (total, unit) =>
        total +
        unit.lessons.filter(
          (lesson) =>
            lesson.completed
        ).length,
      0
    );


  const resetSelection = () => {
    setCountryId("");
    setCurriculumId("");
    setGradeId("");
    setUnitId("");
  };


  let guidance =
    "ابدأ باختيار الدولة.";

  if (countryId && !curriculumId) {
    guidance =
      "الآن اختر المنهج.";
  }
  else if (
    countryId &&
    curriculumId &&
    !gradeId
  ) {
    guidance =
      "الآن اختر الصف الدراسي.";
  }
  else if (
    countryId &&
    curriculumId &&
    gradeId &&
    !unitId
  ) {
    guidance =
      "اختر الوحدة لعرض دروسها.";
  }


  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        <section className="rounded-3xl bg-gradient-to-l from-teal-700 to-emerald-500 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-bold text-teal-100">
            مكتبة التعلم
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            دروس اللغة العربية
          </h1>

          <p className="mt-3 max-w-3xl leading-8 text-teal-50">
            اختر الدولة ثم المنهج والصف والوحدة،
            وبعدها ابدأ الدرس المناسب.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black">
            <span className="rounded-xl bg-white/15 px-4 py-2">
              {scopeUnits.length} وحدات
            </span>

            <span className="rounded-xl bg-white/15 px-4 py-2">
              {totalLessons} دروس
            </span>

            <span className="rounded-xl bg-white/15 px-4 py-2">
              {completedLessons} مكتملة
            </span>
          </div>
        </section>


        <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">

          <div className="flex flex-col gap-2">
            <p className="text-sm font-black text-teal-700">
              مسار المنهج
            </p>

            <h2 className="text-2xl font-black text-slate-950">
              اختر مسارك الدراسي
            </h2>

            <p className="text-sm leading-7 text-slate-500">
              الدولة ← المنهج ← الصف ← الوحدة ← الدرس
            </p>
          </div>


          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                1. الدولة
              </span>

              <select
                value={countryId}
                onChange={(event) => {
                  setCountryId(
                    event.target.value
                  );
                  setCurriculumId("");
                  setGradeId("");
                  setUnitId("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none transition focus:border-teal-500"
              >
                <option value="">
                  اختر الدولة
                </option>

                {countries.map(
                  (country) => (
                    <option
                      key={country.id}
                      value={country.id}
                    >
                      {country.name}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                2. المنهج
              </span>

              <select
                value={curriculumId}
                disabled={!countryId}
                onChange={(event) => {
                  setCurriculumId(
                    event.target.value
                  );
                  setGradeId("");
                  setUnitId("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-teal-500"
              >
                <option value="">
                  اختر المنهج
                </option>

                {curricula.map(
                  (curriculum) => (
                    <option
                      key={curriculum.id}
                      value={curriculum.id}
                    >
                      {curriculum.name}
                      {curriculum.academicYear
                        ? ` — ${curriculum.academicYear}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                3. الصف
              </span>

              <select
                value={gradeId}
                disabled={!curriculumId}
                onChange={(event) => {
                  setGradeId(
                    event.target.value
                  );
                  setUnitId("");
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-teal-500"
              >
                <option value="">
                  اختر الصف
                </option>

                {grades.map(
                  (grade) => (
                    <option
                      key={grade.id}
                      value={grade.id}
                    >
                      {grade.name}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">
                4. الوحدة
              </span>

              <select
                value={unitId}
                disabled={!gradeId}
                onChange={(event) =>
                  setUnitId(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-teal-500"
              >
                <option value="">
                  اختر الوحدة
                </option>

                {gradeUnits.map(
                  (unit) => (
                    <option
                      key={unit.id}
                      value={unit.id}
                    >
                      {unit.title}
                    </option>
                  )
                )}
              </select>
            </label>

          </div>


          {(
            countryId ||
            curriculumId ||
            gradeId ||
            unitId
          ) ? (
            <button
              type="button"
              onClick={resetSelection}
              className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              إعادة الاختيار
            </button>
          ) : null}

        </section>


        <section className="mt-8 space-y-7">

          {!selectedUnit ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="text-5xl">
                🧭
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                {guidance}
              </h2>

              <p className="mt-2 text-slate-500">
                سيظهر محتوى ضاديوم المناسب بعد إكمال الاختيارات.
              </p>
            </div>
          ) : (
            <article
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>
                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl">
                      {selectedUnit.subject.icon ??
                        "📚"}
                    </div>

                    <div>
                      <p className="text-sm font-black text-teal-700">
                        {selectedUnit.country.name}
                        {" • "}
                        {selectedUnit.curriculum.name}
                        {" • "}
                        {selectedUnit.grade.name}
                      </p>

                      <h2 className="text-xl font-black text-slate-950">
                        {selectedUnit.title}
                      </h2>
                    </div>

                  </div>

                  {selectedUnit.description ? (
                    <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                      {selectedUnit.description}
                    </p>
                  ) : null}
                </div>


                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">
                  {selectedUnit.lessons.length} دروس
                </span>

              </div>


              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                {selectedUnit.lessons.map(
                  (lesson) => (
                    <Link
                      key={lesson.id}
                      href={`/lessons/${lesson.id}`}
                      className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-4">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl font-black ${
                            lesson.completed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-teal-50 text-teal-700"
                          }`}
                        >
                          {lesson.completed
                            ? "✓"
                            : lesson.order}
                        </div>

                        <span className="text-xs font-black text-slate-500">
                          {
                            difficultyLabels[
                              lesson.difficulty
                            ]
                          }
                        </span>

                      </div>


                      <h3 className="mt-4 font-black text-slate-950 group-hover:text-teal-700">
                        {lesson.title}
                      </h3>


                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {lesson.objective ??
                          "درس جديد في اللغة العربية."}
                      </p>


                      <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">

                        <span>
                          {lesson.estimatedMinutes} دقيقة
                        </span>

                        <span>
                          {lesson.points} نقطة
                        </span>

                      </div>


                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{
                            width: `${
                              lesson.completed
                                ? 100
                                : lesson.progressPercent
                            }%`,
                          }}
                        />
                      </div>

                    </Link>
                  )
                )}

              </div>
            </article>
          )}


          {units.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">

              <div className="text-5xl">
                📭
              </div>

              <h2 className="mt-4 text-xl font-black text-slate-900">
                لا توجد دروس منشورة
              </h2>

              <p className="mt-2 text-slate-500">
                أضف محتوى من لوحة الإدارة ليظهر هنا.
              </p>

            </div>
          ) : null}

        </section>

      </div>
    </main>
  );
}