"use client";

import {
  useEffect,
  useRef,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import {
  startLessonAction,
} from "../actions/startLesson";

type Props = {
  lessonId: string;
  studentId: string;
};

export default function StartLessonButton({
  lessonId,
  studentId,
}: Props) {
  const router = useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const startedRef =
    useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    startTransition(
      async () => {
        try {
          await startLessonAction(
            lessonId,
            studentId
          );

          router.refresh();
        } catch (error) {
          console.error(
            "AUTO_START_LESSON_FAILED",
            error
          );

          startedRef.current = false;
        }
      }
    );
  }, [
    lessonId,
    studentId,
    router,
  ]);

  return (
    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
      {isPending
        ? "جارٍ بدء الدرس..."
        : "يتم تجهيز الدرس تلقائيًا..."}
    </div>
  );
}
