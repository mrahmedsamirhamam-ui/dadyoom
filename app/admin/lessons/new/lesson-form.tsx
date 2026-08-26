"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import {
  createLesson,
} from "./actions";


type Country = {
  id: string;
  name_ar: string;
};


type Curriculum = {
  id: string;
  name_ar: string;
  country_id: string;
};


type Grade = {
  id: string;
  name_ar: string;
  curriculum_id: string;
  grade_number: number | null;
};


type Unit = {
  id: string;
  title: string;
  grade_id: string;
  unit_number: number | null;
  sort_order: number | null;
};


type GeneratedLesson = {
  sourceText: string;
  sourceUrl: string;
  sourceLocked: boolean;

  objectives: string[];

  introduction: string;

  explanation: string;

  vocabulary: Array<{
    word: string;
    meaning: string;
    example: string;
  }>;

  activities: Array<{
    title: string;
    instructions: string;
  }>;

  assessment: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    answer: string;
  }>;
  homework: string;
};


type GenerateResponse = {
  success?: boolean;
  lesson?: GeneratedLesson;
  error?: string;
};


type Props = {
  countries: Country[];
  curricula: Curriculum[];
  grades: Grade[];
  units: Unit[];
};


const inputClassName =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";


export default function LessonForm({
  countries,
  curricula,
  grades,
  units,
}: Props) {
  const [
    countryId,
    setCountryId,
  ] =
    useState("");

  const [
    curriculumId,
    setCurriculumId,
  ] =
    useState("");

  const [
    gradeId,
    setGradeId,
  ] =
    useState("");

  const [
    unitId,
    setUnitId,
  ] =
    useState("");

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    skill,
    setSkill,
  ] =
    useState("");

  const [
    difficultyLevel,
    setDifficultyLevel,
  ] =
    useState("intermediate");

  const [
    estimatedMinutes,
    setEstimatedMinutes,
  ] =
    useState("20");

  const [
    sourceUrl,
    setSourceUrl,
  ] =
    useState("");

  /*
   * SOURCE_REVIEW_FORM_V1
   */
  const [
    reviewedSourceUrl,
    setReviewedSourceUrl,
  ] =
    useState("");


  const [
    reviewedSourceText,
    setReviewedSourceText,
  ] =
    useState("");

  const [
    reviewedSourcePageStart,
    setReviewedSourcePageStart,
  ] =
    useState<number | null>(
      null
    );

  const [
    reviewedSourcePageEnd,
    setReviewedSourcePageEnd,
  ] =
    useState<number | null>(
      null
    );


  const [
    generatedLesson,
    setGeneratedLesson,
  ] =
    useState<GeneratedLesson | null>(
      null
    );

  const [
    generatedContent,
    setGeneratedContent,
  ] =
    useState("");

  const [
    generateError,
    setGenerateError,
  ] =
    useState("");

  const [
    isGenerating,
    setIsGenerating,
  ] =
    useState(false);



  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            try {
              const stored =
                window.sessionStorage.getItem(
                  "dadyoom.sourceReview.v1"
                );


              if (!stored) {
                return;
              }


              const parsed =
                JSON.parse(
                  stored
                ) as {
                  sourceUrl?: unknown;
                  reviewedSourceText?: unknown;
                  sourcePageStart?: unknown;
                  sourcePageEnd?: unknown;
                };


              const storedUrl =
                typeof parsed.sourceUrl ===
                "string"
                  ? parsed.sourceUrl.trim()
                  : "";


              const storedText =
                typeof parsed.reviewedSourceText ===
                "string"
                  ? parsed.reviewedSourceText.trim()
                  : "";

              const storedPageStart =
                typeof parsed.sourcePageStart ===
                  "number" &&
                Number.isInteger(
                  parsed.sourcePageStart
                ) &&
                parsed.sourcePageStart >= 1 &&
                parsed.sourcePageStart <= 500
                  ? parsed.sourcePageStart
                  : null;

              const storedPageEnd =
                typeof parsed.sourcePageEnd ===
                  "number" &&
                Number.isInteger(
                  parsed.sourcePageEnd
                ) &&
                parsed.sourcePageEnd >= 1 &&
                parsed.sourcePageEnd <= 500
                  ? parsed.sourcePageEnd
                  : null;


              if (
                !storedUrl ||
                storedText.length < 160
              ) {
                return;
              }


              setSourceUrl(
                storedUrl
              );

              setReviewedSourceUrl(
                storedUrl
              );

              setReviewedSourceText(
                storedText
              );

              setReviewedSourcePageStart(
                storedPageStart
              );

              setReviewedSourcePageEnd(
                storedPageEnd
              );

              setGenerateError(
                ""
              );
            }
            catch {
              window.sessionStorage.removeItem(
                "dadyoom.sourceReview.v1"
              );
            }
          },
          0
        );


      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    []
  );


  function resetGenerated() {
    setGeneratedLesson(
      null
    );

    setGeneratedContent(
      ""
    );

    setGenerateError(
      ""
    );
  }


  const filteredCurricula =
    useMemo(
      () =>
        curricula.filter(
          (item) =>
            item.country_id ===
            countryId
        ),
      [
        curricula,
        countryId,
      ]
    );


  const filteredGrades =
    useMemo(
      () =>
        grades
          .filter(
            (item) =>
              item.curriculum_id ===
              curriculumId
          )
          .sort(
            (a, b) =>
              Number(
                a.grade_number ??
                  999
              ) -
              Number(
                b.grade_number ??
                  999
              )
          ),
      [
        grades,
        curriculumId,
      ]
    );


  const filteredUnits =
    useMemo(
      () =>
        units
          .filter(
            (item) =>
              item.grade_id ===
              gradeId
          )
          .sort(
            (a, b) => {
              const unitNumberDiff =
                Number(
                  a.unit_number ??
                    999
                ) -
                Number(
                  b.unit_number ??
                    999
                );

              if (
                unitNumberDiff !==
                0
              ) {
                return unitNumberDiff;
              }

              return (
                Number(
                  a.sort_order ??
                    999
                ) -
                Number(
                  b.sort_order ??
                    999
                )
              );
            }
          ),
      [
        units,
        gradeId,
      ]
    );


  const selectedCountry =
    countries.find(
      (item) =>
        item.id ===
        countryId
    );


  const selectedCurriculum =
    curricula.find(
      (item) =>
        item.id ===
        curriculumId
    );


  const selectedGrade =
    grades.find(
      (item) =>
        item.id ===
        gradeId
    );


  const selectedUnit =
    units.find(
      (item) =>
        item.id ===
        unitId
    );


  const canGenerate =
    Boolean(
      title.trim() &&
        countryId &&
        curriculumId &&
        gradeId &&
        unitId &&
        skill &&
        difficultyLevel
    );


  const canSave =
    Boolean(
      generatedLesson &&
        generatedContent
    );


  async function generateLesson() {
    resetGenerated();

    if (!canGenerate) {
      setGenerateError(
        "أكمل الدولة والمنهج والصف والوحدة والعنوان والمهارة أولًا."
      );

      return;
    }



    const normalizedSourceUrl =
      sourceUrl.trim();


    if (
      normalizedSourceUrl &&
      (
        reviewedSourceUrl !==
          normalizedSourceUrl ||
        reviewedSourceText.trim().length <
          160
      )
    ) {
      setGenerateError(
        "\u0627\u0641\u062d\u0635 \u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631 \u0648\u0631\u0627\u062c\u0639\u0647 \u0648\u0627\u0639\u062a\u0645\u062f\u0647 \u0623\u0648\u0644\u064b\u0627."
      );

      return;
    }


setIsGenerating(
      true
    );


    try {
      const response =
        await fetch(
          "/api/admin/lessons/generate",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  title.trim(),

                country:
                  selectedCountry
                    ?.name_ar ??
                  "",

                curriculum:
                  selectedCurriculum
                    ?.name_ar ??
                  "",

                /*
                 * لا نستخدم educational_stages
                 * في النموذج الأساسي.
                 */
                stage:
                  "",

                grade:
                  selectedGrade
                    ?.name_ar ??
                  "",

                unit:
                  selectedUnit
                    ?.title ??
                  "",

                skill,

                difficulty:
                  difficultyLevel,

                estimatedMinutes:
                  Number(
                    estimatedMinutes
                  ),

                sourceUrl:
                  sourceUrl.trim(),
                reviewedSourceText:
                  reviewedSourceUrl === sourceUrl.trim()
                    ? reviewedSourceText
                    : "",

                sourcePageStart:
                  reviewedSourceUrl === sourceUrl.trim()
                    ? reviewedSourcePageStart
                    : null,

                sourcePageEnd:
                  reviewedSourceUrl === sourceUrl.trim()
                    ? reviewedSourcePageEnd
                    : null,
              }),
          }
        );


      const data =
        (await response.json()) as
          GenerateResponse;


      if (
        !response.ok ||
        !data.lesson
      ) {
        throw new Error(
          data.error ||
            "تعذر إنشاء محتوى الدرس."
        );
      }


      setGeneratedLesson(
        data.lesson
      );

      setGeneratedContent(
        JSON.stringify(
          data.lesson
        )
      );
    }
    catch (error) {
      setGenerateError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء الدرس."
      );
    }
    finally {
      setIsGenerating(
        false
      );
    }
  }


  return (
    <form
      action={createLesson}
      className="space-y-6"
    >
      {/* ====================================================== */}
      {/* المنهج */}
      {/* ====================================================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">
            مكان الدرس في المنهج
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            الدولة ← المنهج ← الصف ← الوحدة
          </p>
        </div>


        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="country_id"
              className="text-sm font-medium"
            >
              الدولة
            </label>

            <select
              id="country_id"
              value={countryId}
              className={
                inputClassName
              }
              required
              onChange={(
                event
              ) => {
                setCountryId(
                  event.target
                    .value
                );

                setCurriculumId(
                  ""
                );

                setGradeId(
                  ""
                );

                setUnitId(
                  ""
                );

                resetGenerated();
              }}
            >
              <option value="">
                اختر الدولة
              </option>

              {countries.map(
                (country) => (
                  <option
                    key={
                      country.id
                    }
                    value={
                      country.id
                    }
                  >
                    {
                      country.name_ar
                    }
                  </option>
                )
              )}
            </select>
          </div>


          <div className="space-y-2">
            <label
              htmlFor="curriculum_id"
              className="text-sm font-medium"
            >
              المنهج
            </label>

            <select
              id="curriculum_id"
              value={
                curriculumId
              }
              className={
                inputClassName
              }
              required
              disabled={
                !countryId
              }
              onChange={(
                event
              ) => {
                setCurriculumId(
                  event.target
                    .value
                );

                setGradeId(
                  ""
                );

                setUnitId(
                  ""
                );

                resetGenerated();
              }}
            >
              <option value="">
                اختر المنهج
              </option>

              {filteredCurricula.map(
                (
                  curriculum
                ) => (
                  <option
                    key={
                      curriculum.id
                    }
                    value={
                      curriculum.id
                    }
                  >
                    {
                      curriculum.name_ar
                    }
                  </option>
                )
              )}
            </select>
          </div>


          <div className="space-y-2">
            <label
              htmlFor="grade_id"
              className="text-sm font-medium"
            >
              الصف
            </label>

            <select
              id="grade_id"
              value={gradeId}
              className={
                inputClassName
              }
              required
              disabled={
                !curriculumId
              }
              onChange={(
                event
              ) => {
                setGradeId(
                  event.target
                    .value
                );

                setUnitId(
                  ""
                );

                resetGenerated();
              }}
            >
              <option value="">
                اختر الصف
              </option>

              {filteredGrades.map(
                (grade) => (
                  <option
                    key={
                      grade.id
                    }
                    value={
                      grade.id
                    }
                  >
                    {
                      grade.name_ar
                    }
                  </option>
                )
              )}
            </select>
          </div>


          <div className="space-y-2">
            <label
              htmlFor="unit_id"
              className="text-sm font-medium"
            >
              الوحدة
            </label>

            <select
              id="unit_id"
              name="unit_id"
              value={unitId}
              className={
                inputClassName
              }
              required
              disabled={
                !gradeId
              }
              onChange={(
                event
              ) => {
                setUnitId(
                  event.target
                    .value
                );

                resetGenerated();
              }}
            >
              <option value="">
                اختر الوحدة
              </option>

              {filteredUnits.map(
                (unit) => (
                  <option
                    key={
                      unit.id
                    }
                    value={
                      unit.id
                    }
                  >
                    {
                      unit.title
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>


      {/* ====================================================== */}
      {/* البيانات الأساسية */}
      {/* ====================================================== */}

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold">
          بيانات الدرس
        </h2>


        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="title"
              className="text-sm font-medium"
            >
              عنوان الدرس
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={title}
              className={
                inputClassName
              }
              required
              placeholder="مثال: الجملة الاسمية"
              onChange={(
                event
              ) => {
                setTitle(
                  event.target
                    .value
                );

                resetGenerated();
              }}
            />
          </div>


          <div className="space-y-2">
            <label
              htmlFor="skill"
              className="text-sm font-medium"
            >
              المهارة
            </label>

            <select
              id="skill"
              name="skill"
              value={skill}
              className={
                inputClassName
              }
              required
              onChange={(
                event
              ) => {
                setSkill(
                  event.target
                    .value
                );

                resetGenerated();
              }}
            >
              <option value="">
                اختر المهارة
              </option>

              <option value="reading">
                القراءة
              </option>

              <option value="writing">
                الكتابة
              </option>

              <option value="listening">
                الاستماع
              </option>

              <option value="speaking">
                التحدث
              </option>

              <option value="grammar">
                القواعد
              </option>

              <option value="vocabulary">
                المفردات
              </option>
            </select>
          </div>


          <div className="space-y-2">
            <label
              htmlFor="difficulty_level"
              className="text-sm font-medium"
            >
              مستوى الصعوبة
            </label>

            <select
              id="difficulty_level"
              name="difficulty_level"
              value={
                difficultyLevel
              }
              className={
                inputClassName
              }
              required
              onChange={(
                event
              ) => {
                setDifficultyLevel(
                  event.target
                    .value
                );

                resetGenerated();
              }}
            >
              <option value="beginner">
                مبتدئ
              </option>

              <option value="intermediate">
                متوسط
              </option>

              <option value="advanced">
                متقدم
              </option>
            </select>
          </div>


          <div className="space-y-2">
            <label
              htmlFor="estimated_minutes"
              className="text-sm font-medium"
            >
              مدة الدرس بالدقائق
            </label>

            <input
              id="estimated_minutes"
              name="estimated_minutes"
              type="number"
              min="1"
              max="180"
              value={
                estimatedMinutes
              }
              className={
                inputClassName
              }
              required
              onChange={(
                event
              ) => {
                setEstimatedMinutes(
                  event.target
                    .value
                );

                resetGenerated();
              }}
            />
          </div>


          <div className="space-y-2">
            <label
              htmlFor="points"
              className="text-sm font-medium"
            >
              نقاط الدرس
            </label>

            <input
              id="points"
              name="points"
              type="number"
              min="0"
              defaultValue="10"
              className={
                inputClassName
              }
              required
            />
          </div>


          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="is_published"
              className="text-sm font-medium"
            >
              حالة الدرس
            </label>

            <select
              id="is_published"
              name="is_published"
              defaultValue="false"
              className={
                inputClassName
              }
            >
              <option value="false">
                مسودة
              </option>

              <option value="true">
                منشور
              </option>
            </select>
          </div>
        </div>
      </section>


      {/* ====================================================== */}
      {/* URL SOURCE */}
      {/* ====================================================== */}

      <section className="rounded-xl border border-sky-200 bg-sky-50/60 p-5">
        <div className="space-y-2">
          <label
            htmlFor="source_url"
            className="text-sm font-bold text-sky-950"
          >
            🔗 رابط الدرس أو المصدر
          </label>

          <input
            id="source_url"
            name="source_url"
            type="url"
            value={sourceUrl}
            placeholder="https://example.com/lesson"
            className={
              inputClassName
            }
            onChange={(
              event
            ) => {
              setSourceUrl(
                event.target
                  .value
              );

              resetGenerated();
            }}
          />

          <p className="text-xs leading-6 text-sky-800">
            اختياري. إذا وضعت رابطًا فسيستخدمه
            ضاديوم مرجعًا لإنشاء المسودة.
            وإذا تركته فارغًا يعمل المولد بالطريقة المعتادة.
          </p>
        </div>
      </section>



      {sourceUrl.trim() ? (
        <div className="rounded-lg border p-4 text-sm">
          {reviewedSourceUrl ===
            sourceUrl.trim() &&
          reviewedSourceText.length >=
            160 ? (
            <p className="text-emerald-700">
              {
                "\u2713 \u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0646\u0635 \u0645\u0635\u062f\u0631 \u0645\u0631\u0627\u062c\u0639 \u0648\u0645\u0639\u062a\u0645\u062f"
              }{" "}
              ({reviewedSourceText.length}{" "}
              {
                "\u062d\u0631\u0641"
              })

              {reviewedSourcePageStart !== null &&
              reviewedSourcePageEnd !== null ? (
                <>
                  {
                    " \u2014 \u0635\u0641\u062d\u0627\u062a PDF: "
                  }
                  {reviewedSourcePageStart}
                  {" \u2192 "}
                  {reviewedSourcePageEnd}
                </>
              ) : null}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-amber-700">
                {
                  "\u064a\u062c\u0628 \u0641\u062d\u0635 \u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631 \u0648\u0645\u0631\u0627\u062c\u0639\u062a\u0647 \u0642\u0628\u0644 \u0627\u0644\u062a\u0648\u0644\u064a\u062f."
                }
              </p>

              <Link
                href="/admin/lessons/source-inspector"
                className="font-medium underline"
              >
                {
                  "\u0641\u062d\u0635 \u0648\u0645\u0631\u0627\u062c\u0639\u0629 \u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631"
                }
              </Link>
            </div>
          )}
        </div>
      ) : null}


      {generateError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {generateError}
        </div>
      ) : null}


      {/* ====================================================== */}
      {/* GENERATED PREVIEW */}
      {/* ====================================================== */}

      {generatedLesson ? (
        <section className="space-y-6 rounded-xl border bg-muted/20 p-6">

          {generatedLesson.sourceLocked &&
          generatedLesson.sourceText ? (
            <div className="space-y-3 rounded-xl border bg-background p-4">
              <div>
                <h3 className="font-bold">
                  {"\u0646\u0635 \u0627\u0644\u0645\u0635\u062f\u0631 \u2014 \u0645\u0642\u0641\u0644"}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {"\u0647\u0630\u0627 \u0627\u0644\u0646\u0635 \u0645\u0633\u062a\u062e\u0631\u062c \u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0644\u0645 \u064a\u0639\u062f \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0635\u064a\u0627\u063a\u062a\u0647."}
                </p>
              </div>

              <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-sm leading-8">
                {generatedLesson.sourceText}
              </div>

              {generatedLesson.sourceUrl ? (
                <p className="break-all text-xs text-muted-foreground">
                  {generatedLesson.sourceUrl}
                </p>
              ) : null}
            </div>
          ) : null}


          <div>
            <p className="font-bold text-emerald-700">
              ✓ تم إنشاء مسودة الدرس
            </p>

            <h2 className="mt-1 text-xl font-bold">
              معاينة المحتوى قبل الحفظ
            </h2>
          </div>


          <div>
            <h3 className="font-bold">
              أهداف الدرس
            </h3>

            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-7">
              {generatedLesson.objectives.map(
                (
                  objective,
                  index
                ) => (
                  <li
                    key={index}
                  >
                    {objective}
                  </li>
                )
              )}
            </ul>
          </div>


          <div>
            <h3 className="font-bold">
              التمهيد
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-8">
              {
                generatedLesson.introduction
              }
            </p>
          </div>


          <div>
            <h3 className="font-bold">
              شرح ضاديوم
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-8">
              {
                generatedLesson.explanation
              }
            </p>
          </div>


          {generatedLesson.vocabulary.length >
          0 ? (
            <div>
              <h3 className="font-bold">
                المفردات
              </h3>

              <div className="mt-3 grid gap-3">
                {generatedLesson.vocabulary.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-3"
                    >
                      <strong>
                        {item.word}
                      </strong>

                      <p className="mt-1 text-sm">
                        {
                          item.meaning
                        }
                      </p>

                      {item.example ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          مثال:{" "}
                          {
                            item.example
                          }
                        </p>
                      ) : null}
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}


          {generatedLesson.activities.length >
          0 ? (
            <div>
              <h3 className="font-bold">
                الأنشطة
              </h3>

              <div className="mt-3 grid gap-3">
                {generatedLesson.activities.map(
                  (
                    activity,
                    index
                  ) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-3"
                    >
                      <strong>
                        {
                          activity.title
                        }
                      </strong>

                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {
                          activity.instructions
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}


          {generatedLesson.assessment.length >
          0 ? (
            <div>
              <h3 className="font-bold">
                التقويم
              </h3>

              <div className="mt-3 grid gap-3">
                {generatedLesson.assessment.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-3"
                    >
                      <p className="font-medium">
                        {index + 1}.{" "}
                        {
                          item.question
                        }
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        الإجابة:{" "}
                        {
                          item.answer
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}


          {generatedLesson.homework ? (
            <div>
              <h3 className="font-bold">
                الواجب المنزلي
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-8">
                {
                  generatedLesson.homework
                }
              </p>
            </div>
          ) : null}
        </section>
      ) : null}


      <textarea
        name="generated_content"
        value={
          generatedContent
        }
        readOnly
        hidden
        aria-hidden="true"
      />


      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={
            generateLesson
          }
          disabled={
            isGenerating
          }
        >
          {isGenerating
            ? "جاري إنشاء الدرس..."
            : sourceUrl.trim()
              ? "✨ إنشاء المسودة من الرابط"
              : "✨ إنشاء بالذكاء الاصطناعي"}
        </Button>


        <Button
          type="submit"
          disabled={
            isGenerating ||
            !canSave
          }
        >
          {canSave
            ? "حفظ الدرس"
            : "أنشئ المسودة أولًا"}
        </Button>
      </div>
    </form>
  );
}
