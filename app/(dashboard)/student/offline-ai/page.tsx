"use client";

import { useState } from "react";

import {
  askOfflineAI,
  initializeOfflineAI,
} from "@/lib/mobile/offline-ai";

export default function OfflineAIPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");

  async function checkModel() {
    setStatus("جارٍ تشغيل ضاد المحلي...");

    try {
      const result = await initializeOfflineAI();
      setStatus(
        result.ready
          ? "ضاد المحلي جاهز ويعمل من داخل الهاتف."
          : "هذه الميزة تعمل داخل تطبيق Android وiPhone.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "تعذر تشغيل ضاد المحلي.",
      );
    }
  }

  async function ask() {
    if (!question.trim()) return;

    setAnswer("");
    setStatus("ضاد المحلي يفكر داخل الهاتف...");

    try {
      const result = await askOfflineAI(question);
      setAnswer(result);
      setStatus("تمت الإجابة محليًا بدون API.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "تعذر تشغيل الذكاء المحلي.",
      );
    }
  }

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen w-full min-w-0 px-3 py-6 sm:px-5"
    >
      <div className="mx-auto w-full max-w-3xl rounded-[2rem] border border-[#dcc899] bg-white p-6 shadow-sm">
        <div className="text-xs font-black text-[#a16f18]">
          ميزة مدمجة في التطبيق
        </div>

        <h1 className="mt-2 text-3xl font-black text-[#123f39]">
          ضاد المحلي
        </h1>

        <p className="mt-3 leading-8 text-[#655e55]">
          موديل AI صغير يأتي داخل التطبيق ويعمل بدون إنترنت للمهام الخفيفة.
          الأسئلة الدراسية المهمة تنتقل لضاد السحابي للحفاظ على جودة العربية.
        </p>

        <button
          type="button"
          onClick={checkModel}
          className="dadyoom-sand-button mt-5 rounded-2xl px-5 py-3 font-black"
        >
          فحص ضاد المحلي
        </button>

        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          placeholder="اكتب طلبًا قصيرًا..."
          className="mt-5 min-h-32 w-full rounded-2xl border border-[#d8c7a6] p-4"
        />

        <button
          type="button"
          onClick={ask}
          className="dadyoom-arabic-button mt-3 rounded-2xl px-5 py-3 font-black text-white"
        >
          اسأل محليًا
        </button>

        {status ? (
          <div className="mt-4 rounded-2xl bg-[#fff7e8] p-4 font-bold">
            {status}
          </div>
        ) : null}

        {answer ? (
          <div className="mt-4 rounded-2xl bg-[#eef8f4] p-5 leading-8">
            {answer}
          </div>
        ) : null}
      </div>
    </main>
  );
}
