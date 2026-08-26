"use client";

import { useState } from "react";
import type { Assessment } from "@/types/assessment";

type UseAssessmentOptions = {
  initialAssessment: Assessment;
};

export function useAssessment({
  initialAssessment,
}: UseAssessmentOptions) {
  const [assessment, setAssessment] =
    useState<Assessment>(initialAssessment);

  const [selectedChoice, setSelectedChoice] =
    useState<string | null>(null);

  const [correct, setCorrect] =
    useState<boolean | null>(null);

  const [explanation, setExplanation] =
    useState<string | null>(null);

  const [showResult, setShowResult] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [loadingNext, setLoadingNext] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const submitAnswer = async () => {
    if (!selectedChoice) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("/api/ai/assessment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessmentId: assessment.id,
          selectedChoice,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment.");
      }

      const result = await response.json();

      setCorrect(result.correct);
      setExplanation(result.explanation);
      setShowResult(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadNextAssessment = async () => {
    try {
      setLoadingNext(true);
      setError(null);

      const response = await fetch("/api/ai/assessment/next");
      if (!response.ok) {
        throw new Error("Failed to fetch next assessment.");
      }

      const nextData: Assessment = await response.json();

      // Reset state for the new assessment
      setAssessment(nextData);
      setSelectedChoice(null);
      setCorrect(null);
      setExplanation(null);
      setShowResult(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load next assessment."
      );
    } finally {
      setLoadingNext(false);
    }
  };

  return {
    assessment,
    selectedChoice,
    correct,
    explanation,
    showResult,
    submitting,
    loadingNext,
    error,

    setSelectedChoice,
    submitAnswer,
    loadNextAssessment,
  };
}
