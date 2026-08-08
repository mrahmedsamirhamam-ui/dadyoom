"use client";

import { logger } from "@/lib/logger";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { createLesson } from "./actions";

type Country = {
  id: string;
  name_ar: string;
};

type Curriculum = {
  id: string;
  name_ar: string;
  country_id: string;
};

type EducationalStage = {
  id: string;
  name_ar: string;
  curriculum_id: string;
};

type Grade = {
  id: string;
  name_ar: string;
  stage_id: string;
};

type Unit = {
  id: string;
  title: string;
  grade_id: string;
};

type LessonFormProps = {
  countries: Country[];
  curricula: Curriculum[];
  stages: EducationalStage[];
  grades: Grade[];
  units: Unit[];
};

type GeneratedLesson = {
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
    answer: string;
  }>;
  homework: string;
};

type GenerateLessonResponse = {
  success?: boolean;
  lesson?: GeneratedLesson;
  error?: string;
};

const inputClassName =
  "h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function LessonForm({
  countries,
  curricula,
  stages,
  grades,
  units,
}: LessonFormProps) {
  const [countryId, setCountryId] = useState("");
  const [curriculumId, setCurriculumId] = useState("");
  const [stageId, setStageId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [unitId, setUnitId] = useState("");

  const [title, setTitle] = useState("");
  const [skill, setSkill] = useState("");
  const [difficultyLevel, setDifficultyLevel] =
    useState("");
  const [estimatedMinutes, setEstimatedMinutes] =
    useState("20");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [generateError, setGenerateError] =
    useState("");

  const [generatedLesson, setGeneratedLesson] =
    useState<GeneratedLesson | null>(null);

  const generatedContent = useMemo(
    () =>
      generatedLesson
        ? JSON.stringify(generatedLesson)
        : "",
    [generatedLesson]
  );

  const canSave =
    Boolean(generatedLesson) &&
    generatedContent.length > 0;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    if (!canSave) {
      event.preventDefault();
      setGenerateError(
        "أنشئ محتوى الدرس بالذكاء الاصطناعي قبل الحفظ."
      );
    }
  }

  const filteredCurricula = useMemo(
    () =>
      curricula.filter(
        (curriculum) =>
          curriculum.country_id === countryId
      ),
    [curricula, countryId]
  );

  const filteredStages = useMemo(
    () =>
      stages.filter(
        (stage) =>
          stage.curriculum_id === curriculumId
      ),
    [stages, curriculumId]
  );

  const filteredGrades = useMemo(
    () =>
      grades.filter(
        (grade) => grade.stage_id === stageId
      ),
    [grades, stageId]
  );

  const filteredUnits = useMemo(
    () =>
      units.filter(
        (unit) => unit.grade_id === gradeId
      ),
    [units, gradeId]
  );

  const selectedCountry = useMemo(
    () =>
      countries.find(
        (country) => country.id === countryId
      ),
    [countries, countryId]
  );

  const selectedCurriculum = useMemo(
    () =>
      curricula.find(
        (curriculum) =>
          curriculum.id === curriculumId
      ),
    [curricula, curriculumId]
  );

  const selectedStage = useMemo(
    () =>
      stages.find(
        (stage) => stage.id === stageId
      ),
    [stages, stageId]
  );

  const selectedGrade = useMemo(
    () =>
      grades.find(
        (grade) => grade.id === gradeId
      ),
    [grades, gradeId]
  );

  const selectedUnit = useMemo(
    () =>
      units.find(
        (unit) => unit.id === unitId
      ),
    [units, unitId]
  );

  function handleCountryChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setCountryId(event.target.value);
    setCurriculumId("");
    setStageId("");
    setGradeId("");
    setUnitId("");
    setGeneratedLesson(null);
    setGenerateError("");
  }

  function handleCurriculumChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setCurriculumId(event.target.value);
    setStageId("");
    setGradeId("");
    setUnitId("");
    setGeneratedLesson(null);
    setGenerateError("");
  }

  function handleStageChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setStageId(event.target.value);
    setGradeId("");
    setUnitId("");
    setGeneratedLesson(null);
    setGenerateError("");
  }

  function handleGradeChange(
    event: ChangeEvent<HTMLSelectElement>
  ) {
    setGradeId(event.target.value);
    setUnitId("");
    setGeneratedLesson(null);
    setGenerateError("");
  }

  async function generateLesson() {
    setGenerateError("");
    setGeneratedLesson(null);

    if (!countryId) {
      setGenerateError("اختر الدولة أولًا.");
      return;
    }

    if (!curriculumId) {
      setGenerateError("اختر المنهج أولًا.");
      return;
    }

    if (!stageId) {
      setGenerateError(
        "اختر المرحلة التعليمية أولًا."
      );
      return;
    }

    if (!gradeId) {
      setGenerateError(
        "اختر الصف الدراسي أولًا."
      );
      return;
    }

    if (!unitId) {
      setGenerateError("اختر الوحدة أولًا.");
      return;
    }

    if (!title.trim()) {
      setGenerateError(
        "اكتب عنوان الدرس أولًا."
      );
      return;
    }

    if (!skill) {
      setGenerateError("اختر المهارة أولًا.");
      return;
    }

    if (!difficultyLevel) {
      setGenerateError(
        "اختر مستوى الصعوبة أولًا."
      );
      return;
    }

    const minutes = Number(estimatedMinutes);

    if (
      !Number.isFinite(minutes) ||
      minutes < 1
    ) {
      setGenerateError(
        "أدخل مدة صحيحة للدرس."
      );
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "/api/admin/lessons/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            country:
              selectedCountry?.name_ar ?? "",
            curriculum:
              selectedCurriculum?.name_ar ?? "",
            stage:
              selectedStage?.name_ar ?? "",
            grade:
              selectedGrade?.name_ar ?? "",
            unit:
              selectedUnit?.title ?? "",
            skill,
            difficulty: difficultyLevel,
            estimatedMinutes: minutes,
          }),
        }
      );

      const data =
        (await response.json()) as GenerateLessonResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر إنشاء الدرس بالذكاء الاصطناعي."
        );
      }

      if (!data.lesson) {
        throw new Error(
          "لم يتم استلام محتوى الدرس."
        );
      }

      setGeneratedLesson(data.lesson);

      logger.debug(
        "GENERATED_LESSON:",
        data.lesson
      );
    } catch (error) {
      console.error(
        "GENERATE_LESSON_ERROR:",
        error
      );

      setGenerateError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع أثناء إنشاء الدرس."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <form
      action={createLesson}
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="country"
            className="text-sm font-medium"
          >
            الدولة
          </label>

          <select
            id="country"
            value={countryId}
            onChange={handleCountryChange}
            className={inputClassName}
            required
          >
            <option value="">
              اختر الدولة
            </option>

            {countries.map((country) => (
              <option
                key={country.id}
                value={country.id}
              >
                {country.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="curriculum"
            className="text-sm font-medium"
          >
            المنهج
          </label>

          <select
            id="curriculum"
            value={curriculumId}
            onChange={
              handleCurriculumChange
            }
            className={inputClassName}
            disabled={!countryId}
            required
          >
            <option value="">
              اختر المنهج
            </option>

            {filteredCurricula.map(
              (curriculum) => (
                <option
                  key={curriculum.id}
                  value={curriculum.id}
                >
                  {curriculum.name_ar}
                </option>
              )
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="stage"
            className="text-sm font-medium"
          >
            المرحلة التعليمية
          </label>

          <select
            id="stage"
            value={stageId}
            onChange={handleStageChange}
            className={inputClassName}
            disabled={!curriculumId}
            required
          >
            <option value="">
              اختر المرحلة
            </option>

            {filteredStages.map((stage) => (
              <option
                key={stage.id}
                value={stage.id}
              >
                {stage.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="grade"
            className="text-sm font-medium"
          >
            الصف الدراسي
          </label>

          <select
            id="grade"
            value={gradeId}
            onChange={handleGradeChange}
            className={inputClassName}
            disabled={!stageId}
            required
          >
            <option value="">
              اختر الصف
            </option>

            {filteredGrades.map((grade) => (
              <option
                key={grade.id}
                value={grade.id}
              >
                {grade.name_ar}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
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
            onChange={(event) => {
              setUnitId(event.target.value);
              setGeneratedLesson(null);
              setGenerateError("");
            }}
            className={inputClassName}
            disabled={!gradeId}
            required
          >
            <option value="">
              اختر الوحدة
            </option>

            {filteredUnits.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t pt-8">
        <h2 className="mb-5 text-xl font-bold">
          بيانات الدرس
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
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
              onChange={(event) => {
                setTitle(event.target.value);
                setGeneratedLesson(null);
                setGenerateError("");
              }}
              placeholder="مثال: الجملة الاسمية"
              className={inputClassName}
              required
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
              onChange={(event) => {
                setSkill(event.target.value);
                setGeneratedLesson(null);
                setGenerateError("");
              }}
              className={inputClassName}
              required
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
              value={difficultyLevel}
              onChange={(event) => {
                setDifficultyLevel(
                  event.target.value
                );
                setGeneratedLesson(null);
                setGenerateError("");
              }}
              className={inputClassName}
              required
            >
              <option value="">
                اختر المستوى
              </option>
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
              value={estimatedMinutes}
              onChange={(event) => {
                setEstimatedMinutes(
                  event.target.value
                );
                setGeneratedLesson(null);
                setGenerateError("");
              }}
              className={inputClassName}
              required
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
              className={inputClassName}
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
              className={inputClassName}
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
      </div>

      {generateError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {generateError}
        </div>
      ) : null}

      {generatedLesson ? (
        <div className="space-y-6 rounded-xl border bg-muted/20 p-6">
          <div>
            <p className="text-sm font-medium text-primary">
              تم إنشاء المحتوى بنجاح
            </p>

            <h2 className="mt-1 text-xl font-bold">
              معاينة محتوى الدرس
            </h2>

            <p className="mt-2 text-sm text-emerald-700">
              المحتوى جاهز للحفظ. اضغط زر
              «حفظ الدرس» لإرساله إلى قاعدة البيانات.
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="font-bold">
              أهداف الدرس
            </h3>

            <ul className="list-inside list-disc space-y-2 text-sm leading-7">
              {generatedLesson.objectives.map(
                (objective, index) => (
                  <li key={index}>
                    {objective}
                  </li>
                )
              )}
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">
              التمهيد
            </h3>

            <p className="whitespace-pre-wrap text-sm leading-8">
              {generatedLesson.introduction}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">
              شرح الدرس
            </h3>

            <p className="whitespace-pre-wrap text-sm leading-8">
              {generatedLesson.explanation}
            </p>
          </section>

          {generatedLesson.vocabulary.length >
          0 ? (
            <section className="space-y-3">
              <h3 className="font-bold">
                المفردات
              </h3>

              <div className="grid gap-3">
                {generatedLesson.vocabulary.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-4"
                    >
                      <p className="font-bold">
                        {item.word}
                      </p>

                      <p className="mt-2 text-sm leading-7">
                        {item.meaning}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        مثال: {item.example}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          {generatedLesson.activities.length >
          0 ? (
            <section className="space-y-3">
              <h3 className="font-bold">
                الأنشطة
              </h3>

              <div className="grid gap-3">
                {generatedLesson.activities.map(
                  (activity, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-4"
                    >
                      <p className="font-bold">
                        {activity.title}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
                        {activity.instructions}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          {generatedLesson.assessment.length >
          0 ? (
            <section className="space-y-3">
              <h3 className="font-bold">
                التقويم
              </h3>

              <div className="grid gap-3">
                {generatedLesson.assessment.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-background p-4"
                    >
                      <p className="font-medium">
                        {index + 1}.{" "}
                        {item.question}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        الإجابة النموذجية:{" "}
                        {item.answer}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h3 className="font-bold">
              الواجب المنزلي
            </h3>

            <p className="whitespace-pre-wrap text-sm leading-8">
              {generatedLesson.homework}
            </p>
          </section>
        </div>
      ) : null}

      <textarea
        name="generated_content"
        value={generatedContent}
        readOnly
        hidden
        aria-hidden="true"
      />

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={generateLesson}
          disabled={isGenerating}
        >
          {isGenerating
            ? "جاري إنشاء الدرس..."
            : "✨ إنشاء بالذكاء الاصطناعي"}
        </Button>

        <Button
          type="submit"
          disabled={isGenerating || !canSave}
        >
          {canSave
            ? "حفظ الدرس"
            : "أنشئ المحتوى أولًا"}
        </Button>
      </div>
    </form>
  );
}