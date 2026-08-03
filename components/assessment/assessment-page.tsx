"use client";

import { useState } from "react";

import type { Assessment } from "@/types/assessment";

import { AssessmentCard } from "./assessment-card";
import { ResultDialog } from "./result-dialog";

type AssessmentPageProps = {
  assessment: Assessment;
};

export function AssessmentPage({
  assessment: initialAssessment,
}: AssessmentPageProps) {
  const [assessment, setAssessment] =
    useState(initialAssessment);

  const [selectedChoice, setSelectedChoice] =
    useState<number | null>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [loadingNext, setLoadingNext] =
    useState(false);

  const [showResult, setShowResult] =
    useState(false);

  const [correct, setCorrect] =
    useState(false);

  const [explanation, setExplanation] =
    useState("");

  async function handleSubmit() {
    if (selectedChoice === null || submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/ai/assessment/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assessmentId: assessment.id,
            answer: selectedChoice,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "تعذر إرسال الإجابة"
        );
      }

      setCorrect(result.correct);

      setExplanation(
        `${result.explanation}

⭐ حصلت على ${result.earnedPoints ?? 0} نقطة`
      );

      setShowResult(true);
    } catch (error) {
      console.error(error);

      setCorrect(false);
      setExplanation(
        "حدث خطأ أثناء إرسال الإجابة. حاول مرة أخرى."
      );
      setShowResult(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (loadingNext) {
      return;
    }

    try {
      setLoadingNext(true);

      const response = await fetch(
        "/api/ai/assessment/next",
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "تعذر إنشاء السؤال التالي"
        );
      }

      const assessmentResponse = await fetch(
        `/api/ai/assessment/${result.id}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const assessmentResult =
        await assessmentResponse.json();

      if (
        !assessmentResponse.ok ||
        !assessmentResult.success
      ) {
        throw new Error(
          assessmentResult.error ??
            "تعذر تحميل السؤال التالي"
        );
      }

      setAssessment(assessmentResult.assessment);
      setSelectedChoice(null);
      setShowResult(false);
      setCorrect(false);
      setExplanation("");
    } catch (error) {
      console.error(error);

      setCorrect(false);
      setExplanation(
        "تعذر إنشاء السؤال التالي. حاول مرة أخرى."
      );
    } finally {
      setLoadingNext(false);
    }
  }

  return (
    <>
      <AssessmentCard
        assessment={assessment}
        selectedChoice={selectedChoice}
        loading={submitting}
        onSelect={setSelectedChoice}
        onSubmit={handleSubmit}
      />

      <ResultDialog
        open={showResult}
        correct={correct}
        explanation={explanation}
        onNext={handleNext}
      />
    </>
  );
}