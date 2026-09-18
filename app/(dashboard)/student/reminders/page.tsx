"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  cancelDailyLearningReminder,
  installReminderActionListener,
  isNativeDadyoomApp,
  scheduleDailyLearningReminder,
} from "@/lib/mobile/daily-reminder";

export default function StudentRemindersPage() {
  const [
    time,
    setTime,
  ] =
    useState("19:00");

  const [
    status,
    setStatus,
  ] =
    useState("");

  const [
    native,
    setNative,
  ] =
    useState(false);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          setNative(
            isNativeDadyoomApp(),
          );

          const saved =
            window.localStorage.getItem(
              "dadyoom-reminder-time",
            );

          if (
            saved &&
            /^\d{2}:\d{2}$/u.test(
              saved,
            )
          ) {
            setTime(saved);
          }
        },
        0,
      );

    let cleanup:
      | (() => void)
      | undefined;

    void installReminderActionListener().then(
      (remove) => {
        cleanup =
          remove;
      },
    );

    return () => {
      window.clearTimeout(
        timer,
      );
      cleanup?.();
    };
  }, []);

  async function save() {
    const [
      rawHour,
      rawMinute,
    ] =
      time
        .split(":")
        .map(Number);

    const hour =
      Number.isFinite(
        rawHour,
      )
        ? Math.min(
            23,
            Math.max(
              0,
              rawHour,
            ),
          )
        : 19;

    const minute =
      Number.isFinite(
        rawMinute,
      )
        ? Math.min(
            59,
            Math.max(
              0,
              rawMinute,
            ),
          )
        : 0;

    setStatus(
      "جارٍ حفظ التذكير...",
    );

    try {
      const result =
        await scheduleDailyLearningReminder(
          hour,
          minute,
        );

      setStatus(
        result.message,
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "تعذر حفظ التذكير.",
      );
    }
  }

  async function cancel() {
    await cancelDailyLearningReminder();

    setStatus(
      "تم إلغاء التذكير اليومي.",
    );
  }

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen w-full min-w-0 px-3 py-6 sm:px-5"
    >
      <div className="mx-auto w-full max-w-3xl">
        <section className="rounded-[2rem] border border-[#dcc899] bg-white p-6 shadow-sm">
          <div className="text-xs font-black text-[#a16f18]">
            تطبيق ضاديوم
          </div>

          <h1 className="mt-2 text-3xl font-black text-[#123f39]">
            تذكير التعلم اليومي
          </h1>

          <p className="mt-3 leading-8 text-[#655e55]">
            اختر الوقت المناسب لك. داخل تطبيق Android أو iPhone سيصلك تذكير يومي ويمكن الضغط عليه للرجوع إلى ضاديوم.
          </p>

          <div className="mt-6 rounded-2xl bg-[#fff7e8] p-4">
            <div className="font-black text-[#123f39]">
              حالة التطبيق
            </div>

            <div className="mt-1 text-sm">
              {native
                ? "أنت داخل تطبيق ضاديوم."
                : "أنت على نسخة الويب؛ سيُحفظ الوقت حتى تستخدم التطبيق."}
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block font-black">
              وقت التذكير
            </span>

            <input
              type="time"
              value={time}
              onChange={(
                event,
              ) =>
                setTime(
                  event.target.value,
                )
              }
              className="w-full rounded-2xl border border-[#d8c7a6] bg-white px-4 py-3 text-lg font-black"
            />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white"
            >
              فعّل تذكير اليوم
            </button>

            <button
              type="button"
              onClick={cancel}
              className="dadyoom-sand-button rounded-2xl px-5 py-3 font-black"
            >
              إلغاء التذكير
            </button>
          </div>

          {status ? (
            <div className="mt-5 rounded-2xl bg-[#eef8f4] p-4 font-bold leading-7">
              {status}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
