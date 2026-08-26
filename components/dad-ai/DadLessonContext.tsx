"use client";

import { useEffect } from "react";

export type DadLessonContextPayload = {
  pageTitle: string;
  lessonTitle: string;
  lessonContent: string;
};

export const DAD_LESSON_CONTEXT_EVENT = "dadyoom:lesson-context";

export default function DadLessonContext({
  pageTitle,
  lessonTitle,
  lessonContent,
}: DadLessonContextPayload) {
  useEffect(() => {
    const payload: DadLessonContextPayload = {
      pageTitle,
      lessonTitle,
      lessonContent,
    };

    window.dispatchEvent(
      new CustomEvent<DadLessonContextPayload>(DAD_LESSON_CONTEXT_EVENT, {
        detail: payload,
      })
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent<DadLessonContextPayload>(DAD_LESSON_CONTEXT_EVENT, {
          detail: {
            pageTitle: "ضاديوم",
            lessonTitle: "",
            lessonContent: "",
          },
        })
      );
    };
  }, [lessonContent, lessonTitle, pageTitle]);

  return null;
}
