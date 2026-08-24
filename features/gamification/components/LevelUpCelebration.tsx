"use client";

import {
  useEffect,
  useRef,
} from "react";

type Props = {
  userId: string;
  level: number;
  totalXP: number;
};

export default function LevelUpCelebration({
  userId,
  level,
  totalXP,
}: Props) {
  const dialogRef =
    useRef<HTMLDialogElement>(
      null
    );

  useEffect(() => {
    const key =
      `dadyoom:last-level:${userId}`;

    const previous =
      Number(
        window.localStorage.getItem(
          key
        )
      );

    window.localStorage.setItem(
      key,
      String(level)
    );

    if (
      Number.isFinite(previous) &&
      previous > 0 &&
      level > previous
    ) {
      dialogRef.current
        ?.showModal();
    }
  }, [
    userId,
    level,
  ]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(92vw,420px)] rounded-3xl bg-transparent p-0 backdrop:bg-slate-950/50"
    >
      <div
        dir="rtl"
        className="overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-7 text-center text-white">
          <div className="text-6xl">
            🎉
          </div>

          <p className="mt-4 text-sm font-bold text-violet-100">
            مستوى جديد
          </p>

          <h2 className="mt-1 text-3xl font-black">
            وصلت إلى المستوى {level}
          </h2>

          <p
            dir="ltr"
            className="mt-3 text-lg font-black"
          >
            {totalXP} XP
          </p>
        </div>

        <div className="p-6 text-center">
          <p className="leading-7 text-slate-600">
            تقدم رائع. استمر في الدروس والمهارات والتحديات لبناء سلسلة أقوى وفتح أوسمة جديدة.
          </p>

          <form method="dialog">
            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-violet-600 px-5 py-3 font-black text-white transition hover:bg-violet-700"
            >
              أكمل رحلتي 🚀
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
}
