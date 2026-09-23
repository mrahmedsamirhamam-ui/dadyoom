"use client";

import { useState } from "react";

import {
  askOfflineAI,
  getOfflineAIModelInfo,
  initializeOfflineAI,
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
      "OFFLINE_AI_IOS_BUNDLE_PENDING_XCODE",
    )
  ) {
    return "نسخة iPhone ستُجهّز في مرحلة Xcode.";
  }

  if (
    message.includes(
      "native-app-required",
    )
  ) {
    return "ضاد المحلي يعمل من داخل تطبيق الهاتف.";
  }

  return (
    message ||
    "تعذر تشغيل ضاد المحلي."
  );
}

export default function OfflineAIPage() {
  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [status, setStatus] =
    useState(
      "ضاد المحلي المتقدم مدمج داخل نسخة Android ولا يحتاج تنزيلًا منفصلًا.",
    );

  const [busy, setBusy] =
    useState(false);

  async function checkModel() {
    setBusy(true);
    setStatus(
      "جارٍ تشغيل ضاد المحلي من ملفات التطبيق...",
    );

    try {
      const result =
        await initializeOfflineAI();

      setStatus(
        result.ready
          ? "ضاد المحلي جاهز داخل الهاتف."
          : "تعذر تشغيل ضاد المحلي.",
      );
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
          ضاد المحلي — مدمج داخل التطبيق
        </div>

        <h1 className="mt-2 text-3xl font-black text-[#123f39]">
          AI بدون إنترنت
        </h1>

        <p className="mt-3 leading-8 text-[#655e55]">
          هذه النسخة تستخدم{" "}
          <strong>
            {model.name}
          </strong>
          {" "}المحسّن للمساعدة التعليمية باللغة العربية،
          وهو مدمج داخل نسخة Android.
        </p>

        <button
          type="button"
          onClick={() =>
            void checkModel()
          }
          disabled={busy}
          className="dadyoom-sand-button mt-5 rounded-2xl px-5 py-3 font-black disabled:opacity-60"
        >
          فحص ضاد المحلي
        </button>

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(
              event.target.value,
            )
          }
          placeholder="مثال: أعرب الجملة: ذهب محمد إلى السوق."
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
          اسأل ضاد المحلي
        </button>

        {status ? (
          <div className="mt-4 rounded-2xl bg-[#fff7e8] p-4 font-bold leading-7">
            {status}
          </div>
        ) : null}

        {answer ? (
          <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#eef8f4] p-5 leading-8">
            {answer}
          </div>
        ) : null}

        <p className="mt-5 text-xs leading-6 text-[#7b7265]">
          ضاد السحابي يظل أقوى عند توفر الإنترنت، بينما
          ضاد المحلي مخصص للشرح والنحو والصرف والإملاء
          والتلخيص والمساعدة التعليمية عندما لا توجد شبكة.
        </p>
      </div>
    </main>
  );
}
