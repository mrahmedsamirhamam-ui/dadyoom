"use client";

import {
  useState,
} from "react";

import {
  updateLessonObjectives,
} from "@/features/teacher/actions/updateLessonObjectives";

type Props = {
  lessonId: string;
  objectives: string[];
};

export default function LessonObjectivesEditor({
  lessonId,
  objectives: initialObjectives,
}: Props) {
  const [
    objectives,
    setObjectives,
  ] =
    useState<string[]>(
      initialObjectives.length > 0
        ? initialObjectives
        : [""]
    );

  function updateObjective(
    index: number,
    value: string
  ) {
    setObjectives(
      (current) =>
        current.map(
          (objective, currentIndex) =>
            currentIndex === index
              ? value
              : objective
        )
    );
  }

  function addObjective() {
    setObjectives(
      (current) => [
        ...current,
        "",
      ]
    );
  }

  function removeObjective(
    index: number
  ) {
    setObjectives(
      (current) => {
        const next =
          current.filter(
            (_, currentIndex) =>
              currentIndex !== index
          );

        return next.length > 0
          ? next
          : [""];
      }
    );
  }

  function moveObjective(
    index: number,
    direction: -1 | 1
  ) {
    setObjectives(
      (current) => {
        const target =
          index + direction;

        if (
          target < 0 ||
          target >= current.length
        ) {
          return current;
        }

        const next = [
          ...current,
        ];

        const temp =
          next[index];

        next[index] =
          next[target];

        next[target] =
          temp;

        return next;
      }
    );
  }

  return (
    <form
      action={updateLessonObjectives}
      className="space-y-5 rounded-2xl border bg-white p-6"
    >
      <input
        type="hidden"
        name="id"
        value={lessonId}
      />

      <input
        type="hidden"
        name="objectives_json"
        value={JSON.stringify(
          objectives
        )}
      />

      <div>
        <h2 className="text-2xl font-bold">
          {"\u0623\u0647\u062f\u0627\u0641 \u0627\u0644\u062a\u0639\u0644\u0645"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {"\u0623\u0636\u0641 \u0623\u0647\u062f\u0627\u0641 \u0627\u0644\u062f\u0631\u0633 \u0648\u0631\u062a\u0628\u0647\u0627 \u0628\u0627\u0644\u062a\u0633\u0644\u0633\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628."}
        </p>
      </div>

      <div className="space-y-4">
        {objectives.map(
          (
            objective,
            index
          ) => (
            <div
              key={index}
              className="rounded-xl border bg-slate-50 p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-600">
                  {"\u0627\u0644\u0647\u062f\u0641 "}
                  {index + 1}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Move objective up"
                    disabled={
                      index === 0
                    }
                    onClick={() =>
                      moveObjective(
                        index,
                        -1
                      )
                    }
                    className="rounded-lg border bg-white px-3 py-1 disabled:opacity-40"
                  >
                    {"\u2191"}
                  </button>

                  <button
                    type="button"
                    aria-label="Move objective down"
                    disabled={
                      index ===
                      objectives.length - 1
                    }
                    onClick={() =>
                      moveObjective(
                        index,
                        1
                      )
                    }
                    className="rounded-lg border bg-white px-3 py-1 disabled:opacity-40"
                  >
                    {"\u2193"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeObjective(
                        index
                      )
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-red-700"
                  >
                    {"\u062d\u0630\u0641"}
                  </button>
                </div>
              </div>

              <textarea
                value={objective}
                onChange={(event) =>
                  updateObjective(
                    index,
                    event.target.value
                  )
                }
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border bg-white p-3"
                placeholder={
                  "\u0627\u0643\u062a\u0628 \u0647\u062f\u0641 \u0627\u0644\u062a\u0639\u0644\u0645..."
                }
              />
            </div>
          )
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addObjective}
          className="rounded-xl border border-emerald-600 px-5 py-3 font-bold text-emerald-700"
        >
          {"\u0625\u0636\u0627\u0641\u0629 \u0647\u062f\u0641"}
        </button>

        <button
          type="submit"
          data-testid="lesson-objectives-save"
          className="rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {"\u062d\u0641\u0638 \u0627\u0644\u0623\u0647\u062f\u0627\u0641"}
        </button>
      </div>
    </form>
  );
}
