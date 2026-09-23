"use client";

import { useState } from "react";

import {
  askOfflineAI,
  getOfflineAIModelInfo,
  hasOfflineAIModel,
  initializeOfflineAI,
  installOfflineAIModel,
} from "@/lib/mobile/offline-ai";

const model =
  getOfflineAIModelInfo();

function friendlyError(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.includes(
      "OFFLINE_AI_NATIVE_APP_REQUIRED",
    )
  ) {
    return "تثبيت ضاد المحلي متاح داخل تطبيق Android وiPhone فقط.";
  }

  if (
    message.includes(
      "OFFLINE_AI_MODEL_NOT_INSTALLED_CONNECT_ONCE",
    )
  ) {
    return "الموديل المحلي لم يُنزّل بعد. اتصل بالإنترنت مرة واحدة واضغط «تثبيت ضاد المحلي»، وبعدها سيعمل بدون إنترنت.";
  }

  return message ||
    "تعذر تشغيل ضاد المحلي.";
}

export default function OfflineAIPage() {
  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [progress, setProgress] =
    useState<number | null>(
      hasOfflineAIModel()
        ? 100
        : null,
    );

  const [busy, setBusy] =
    useState(false);

  async function install() {
    setBusy(true);
    setAnswer("");
    setStatus(
      "جارٍ تجهيز ضاد المحلي على الهاتف...",
    );

    try {
      const result =
        await installOfflineAIModel(
          (value) => {
            setProgress(value);
            setStatus(
              `جارٍ تنزيل الموديل المحلي: ${value}%`,
            );
          },
        );

      if (!result.native) {
        setStatus(
          "هذه الميزة تعمل داخل تطبيق Android وiPhone.",
        );
        return;
      }

      setStatus(
        "تم تنزيل ضاد المحلي. جارٍ اختبار الموديل...",
      );

      const ready =
        await initializeOfflineAI();

      setProgress(100);
      setStatus(
        ready.ready
          ? "ضاد المحلي جاهز. يمكنك الآن استخدامه بعد قطع الإنترنت."
          : "تعذر تشغيل الموديل المحلي.",
      );
    } catch (error) {
      setStatus(
        friendlyError(error),
      );
    } finally {
      setBusy(false);
    }
  }

  async function checkModel() {
    setBusy(true);
    setStatus(
      "جارٍ فحص ضاد المحلي...",
    );

    try {
      const result =
        await initializeOfflineAI(
          (value) =>
            setProgress(value),
        );

      setStatus(
        result.ready
          ? "ضاد المحلي جاهز ويعمل من داخل الهاتف."
          : "هذه الميزة تعمل داخل تطبيق Android وiPhone.",
      );

      if (result.ready) {
        setProgress(100);
      }
    } catch (error) {
      setStatus(
        friendlyError(error),
      );
    } finally {
      setBusy(false);
    }
  }

  async function ask() {
    if (!question.trim()) {
      return;
    }

    setBusy(true);
    setAnswer("");
    setStatus(
      "ضاد المحلي يفكر داخل الهاتف...",
    );

    try {
      const result =
        await askOfflineAI(
          question,
        );

      setAnswer(result);
      setStatus(
        "تمت الإجابة محليًا من الهاتف بدون API.",
      );
    } catch (error) {
      setStatus(
        friendlyError(error),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen w-full min-w-0 px-3 py-6 sm:px-5"
    >
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-[#dcc899] bg-white p-6 shadow-sm">
        <div className="text-xs font-black text-[#a16f18]">
          ضاد المحلي — يعمل على الجهاز
        </div>

        <h1 className="mt-2 text-3xl font-black text-[#123f39]">
          AI بدون إنترنت
        </h1>

        <p className="mt-3 leading-8 text-[#655e55]">
          يستخدم ضاديوم موديل{" "}
          <strong>
            {model.name}
          </strong>
          . يتم تنزيله مرة واحدة داخل التطبيق
          بحجم يقارب{" "}
          <strong>
            {model.approximateSizeMb} MB
          </strong>
          ، وبعد اكتمال التنزيل يعمل محليًا
          بدون API وبدون اتصال بالإنترنت.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void install()
            }
            disabled={busy}
            className="dadyoom-sand-button rounded-2xl px-5 py-3 font-black disabled:opacity-60"
          >
            تثبيت ضاد المحلي
          </button>

          <button
            type="button"
            onClick={() =>
              void checkModel()
            }
            disabled={busy}
            className="rounded-2xl border border-[#c7aa6d] bg-white px-5 py-3 font-black text-[#123f39] disabled:opacity-60"
          >
            فحص الجاهزية
          </button>
        </div>

        {progress !== null ? (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-[#665b4b]">
              <span>
                تنزيل الموديل
              </span>
              <span>
                {progress}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#eee3ca]">
              <div
                className="h-full rounded-full bg-[#123f39] transition-[width]"
                style={{
                  width:
                    `${progress}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value,
            )
          }
          placeholder="بعد تثبيت الموديل، اكتب طلبًا قصيرًا..."
          className="mt-5 min-h-32 w-full rounded-2xl border border-[#d8c7a6] p-4"
        />

        <button
          type="button"
          onClick={() =>
            void ask()
          }
          disabled={busy}
          className="dadyoom-arabic-button mt-3 rounded-2xl px-5 py-3 font-black text-white disabled:opacity-60"
        >
          اسأل محليًا
        </button>

        {status ? (
          <div className="mt-4 rounded-2xl bg-[#fff7e8] p-4 font-bold leading-7">
            {status}
          </div>
        ) : null}

        {answer ? (
          <div className="mt-4 rounded-2xl bg-[#eef8f4] p-5 leading-8">
            {answer}
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-6 text-[#7b7265]">
          يظل ضاد السحابي هو الخيار الأساسي عند توفر الإنترنت.
          ضاد المحلي مخصص للتلخيص، والشرح القصير،
          والمساعدة الخفيفة عندما لا تتوفر الشبكة.
        </p>
      </div>
    </main>
  );
}
