"use client";

import { Assessment } from "@/types/assessment";
import { ChoiceOption } from "./choice-option";
import { SubmitButton } from "./submit-button";

type AssessmentCardProps = {
  assessment: Assessment;
  selectedChoice: number | null;
  loading: boolean;
  onSelect: (index: number) => void;
  onSubmit: () => void;
};

export function AssessmentCard({
  assessment,
  selectedChoice,
  loading,
  onSelect,
  onSubmit,
}: AssessmentCardProps) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-lg">

      <div className="mb-6">
        <span className="rounded-full bg-teal-100 px-4 py-2 text-sm font-bold text-teal-700">
          {assessment.skill}
        </span>

        <span className="mr-3 rounded-full bg-slate-100 px-4 py-2 text-sm">
          {assessment.difficulty}
        </span>
      </div>

      <h1 className="mb-6 text-3xl font-bold">
        {assessment.title}
      </h1>

      <div className="mb-8 rounded-2xl bg-slate-50 p-6 leading-8">
        {assessment.passage}
      </div>

      <h2 className="mb-6 text-xl font-bold">
        {assessment.question}
      </h2>

      <div className="space-y-4">
        {assessment.choices.map((choice, index) => (
          <ChoiceOption
            key={index}
            text={choice}
            selected={selectedChoice === index}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>

      <div className="mt-8">
        <SubmitButton
          loading={loading}
          disabled={selectedChoice === null}
          onClick={onSubmit}
        />
      </div>

    </div>
  );
}