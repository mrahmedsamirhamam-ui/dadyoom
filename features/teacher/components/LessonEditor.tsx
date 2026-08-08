"use client";

import { useState } from "react";

type Tab =
  | "general"
  | "content"
  | "vocabulary"
  | "questions"
  | "objectives"
  | "media";

type Props = {
  general: React.ReactNode;
  content: React.ReactNode;
  vocabulary: React.ReactNode;
  questions: React.ReactNode;
  objectives: React.ReactNode;
  media: React.ReactNode;
};

export default function LessonEditor(props: Props) {
  const [tab, setTab] =
    useState<Tab>("general");

  const tabs = [
    { key: "general", label: "المعلومات" },
    { key: "content", label: "المحتوى" },
    { key: "vocabulary", label: "المفردات" },
    { key: "questions", label: "الأسئلة" },
    { key: "objectives", label: "الأهداف" },
    { key: "media", label: "الوسائط" },
  ] as const;

  return (
    <>
      <div className="mb-8 flex gap-3 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`rounded-xl px-5 py-3 font-semibold transition ${
              tab === item.key
                ? "bg-emerald-600 text-white"
                : "bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" && props.general}
      {tab === "content" && props.content}
      {tab === "vocabulary" && props.vocabulary}
      {tab === "questions" && props.questions}
      {tab === "objectives" && props.objectives}
      {tab === "media" && props.media}
    </>
  );
}