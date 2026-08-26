"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDadState } from "@/hooks/use-dad-state";
import { DadAI } from "@/services/dad-ai";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPageGreeting(pathname: string) {
  if (pathname === "/") {
    return "مرحبًا بك في ضاديوم! أنا ضاد، رفيقك في رحلة العربية.";
  }

  if (pathname.startsWith("/student")) {
    return "مرحبًا يا بطل! أنا هنا لمساعدتك في متابعة رحلتك وإنجاز هدفك اليوم.";
  }

  if (pathname.startsWith("/courses")) {
    return "اختر الدرس الذي تريد أن نبدأه معًا، ويمكنك سؤالي عن أي جزء.";
  }

  if (pathname.startsWith("/journey")) {
    return "هيا نكتشف محطتك التالية في رحلة العربية.";
  }

  if (pathname.startsWith("/dictionary")) {
    return "اكتب كلمة أو جملة، وسأشرح لك معناها في السياق.";
  }

  if (pathname.startsWith("/ask")) {
    return "اسألني ما تريد عن اللغة العربية، وسأحاول تبسيطه لك.";
  }

  return "أهلًا بك! أنا ضاد، رفيقك الذكي في ضاديوم.";
}

export default function DadBook() {
  const pathname = usePathname();
  const dadState = useDadState();

  // 1. تحديد قيم الحالة وتكوين حركة ضاد الديناميكية
  const isIdle = dadState === "idle";
  const isThinking = dadState === "thinking";
  const isTalking = dadState === "talking";
  const isCorrect = dadState === "correct";
  const isEncouraging = dadState === "encouraging";
  const isCelebrating = dadState === "celebrating";
  const isError = dadState === "error";

  const dadMotion = (() => {
    if (isThinking) {
      return {
        y: [0, -4, 0],
        rotate: [-3, 3, -3],
        scale: [1, 1.04, 1],
      };
    }

    if (isTalking) {
      return {
        y: [0, -3, 0],
        rotate: [-2, 2, -2],
        scale: [1, 1.03, 1],
      };
    }

    if (isCorrect) {
      return {
        y: [0, -10, 0],
        rotate: [-5, 5, 0],
        scale: [1, 1.16, 1],
      };
    }

    if (isEncouraging) {
      return {
        x: [-4, 4, -4, 4, 0],
        scale: [1, 1.04, 1],
      };
    }

    if (isCelebrating) {
      return {
        y: [0, -18, 0, -10, 0],
        rotate: [-10, 10, -8, 8, 0],
        scale: [1, 1.18, 1.08, 1],
      };
    }

    if (isError) {
      return {
        rotate: [-7, 7, -7, 7, 0],
        opacity: [1, 0.65, 1],
      };
    }

    return {
      y: [0, -3, 0, 2, 0],
      scale: [1, 1.02, 1, 0.99, 1],
    };
  })();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content: getPageGreeting(pathname),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      setMessages([
        {
          id: createId(),
          role: "assistant",
          content: getPageGreeting(pathname),
        },
      ]);

      setInput("");
      setIsOpen(false);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending]);

  // 5. ربط حالة الكلام بالصوت عبر أحداث النافذة
  useEffect(() => {
    function handleVoiceStart() {
      DadAI.talk();
    }

    function handleVoiceEnd() {
      if (DadAI.getState() === "talking") {
        DadAI.idle();
      }
    }

    window.addEventListener("dadyoom:voice-start", handleVoiceStart);
    window.addEventListener("dadyoom:voice-end", handleVoiceEnd);

    return () => {
      window.removeEventListener("dadyoom:voice-start", handleVoiceStart);
      window.removeEventListener("dadyoom:voice-end", handleVoiceEnd);
    };
  }, []);

  useEffect(() => {
    function handleAssistantMessage(event: Event) {
      const customEvent = event as CustomEvent<{
        message?: string;
        open?: boolean;
      }>;

      if (customEvent.detail?.message) {
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: "assistant",
            content: customEvent.detail.message!,
          },
        ]);
      }

      setIsOpen(customEvent.detail?.open ?? true);
    }

    function handleLessonCompleted() {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content:
            "أحسنت يا بطل! أكملت الدرس بنجاح وحققت تقدمًا جديدًا 🎉",
        },
      ]);

      setIsOpen(true);
    }

    window.addEventListener(
      "dadyoom:assistant-message",
      handleAssistantMessage
    );

    window.addEventListener(
      "dadyoom:lesson-completed",
      handleLessonCompleted
    );

    return () => {
      window.removeEventListener(
        "dadyoom:assistant-message",
        handleAssistantMessage
      );

      window.removeEventListener(
        "dadyoom:lesson-completed",
        handleLessonCompleted
      );
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = input.trim();

    if (!question || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          page: pathname,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const serverMessage =
          data?.answer ||
          data?.error ||
          `فشل الطلب، رمز الخطأ: ${response.status}`;

        throw new Error(serverMessage);
      }

      const answer =
        data.answer ||
        data.message ||
        data.response ||
        "وصلني سؤالك، لكن لم أتمكن من إعداد الإجابة الآن.";

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (error) {
      console.error("DadBook error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "حدثت مشكلة غير معروفة.";

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function clearConversation() {
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content: getPageGreeting(pathname),
      },
    ]);
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end sm:bottom-5 sm:right-5"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 15,
              scale: 0.94,
            }}
            className="mb-3 flex h-[460px] w-[calc(100vw-32px)] max-w-[370px] flex-col overflow-hidden rounded-[2rem] border border-teal-100 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between bg-gradient-to-l from-teal-800 to-teal-600 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/dad-book.png"
                  alt=""
                  width={48}
                  height={54}
                  className="h-12 w-auto"
                />

                <div>
                  <h2 className="font-black">ضاد</h2>
                  <p className="text-xs text-teal-100">
                    رفيقك في رحلة العربية
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearConversation}
                  aria-label="بدء محادثة جديدة"
                  title="محادثة جديدة"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:bg-white/15"
                >
                  ↻
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="إغلاق ضاد"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-2xl transition hover:bg-white/15"
                >
                  ×
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fbfa] p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm font-medium leading-7 ${
                      message.role === "user"
                        ? "rounded-br-md bg-teal-700 text-white"
                        : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-600" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-100 bg-white p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="اكتب سؤالك هنا..."
                  rows={1}
                  disabled={isSending}
                  className="max-h-28 min-h-12 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100 disabled:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-xl font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  aria-label="إرسال السؤال"
                >
                  ↑
                </button>
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                ضاد يساعدك في التعلم، وقد تحتاج الإجابات المهمة إلى مراجعة معلمك.
              </p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="فتح ضاد"
        aria-expanded={isOpen}
        // 2. تحديث animate و transition
        animate={dadMotion}
        transition={{
          duration: isIdle ? 3.6 : isCelebrating ? 1.2 : 0.9,
          repeat: isIdle || isThinking || isTalking ? Infinity : 0,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative rounded-[2rem] bg-transparent p-0 outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
      >
        <span className="absolute inset-x-4 bottom-1 h-5 rounded-full bg-black/15 blur-md" />

        {/* 3. إضافة فقاعات تأثيرات الحالة فوق الأيقونة */}
        <AnimatePresence>
          {isThinking ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.8 }}
              className="absolute -top-14 right-0 z-30 rounded-2xl bg-white px-3 py-2 text-xs font-black text-violet-700 shadow-xl"
            >
              🤔 أفكر...
            </motion.div>
          ) : null}

          {isTalking ? (
            <motion.div
              key="talking"
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.8 }}
              className="absolute -top-14 right-0 z-30 rounded-2xl bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-xl"
            >
              🗣️ أتحدث الآن
            </motion.div>
          ) : null}

          {isCorrect ? (
            <motion.div
              key="correct"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute -top-14 right-0 z-30 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 shadow-xl"
            >
              ⭐ إجابة رائعة
            </motion.div>
          ) : null}

          {isEncouraging ? (
            <motion.div
              key="encouraging"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute -top-14 right-0 z-30 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 shadow-xl"
            >
              💪 حاول مرة أخرى
            </motion.div>
          ) : null}

          {isCelebrating ? (
            <motion.div
              key="celebrating"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.08 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-14 right-0 z-30 rounded-2xl bg-fuchsia-50 px-3 py-2 text-xs font-black text-fuchsia-700 shadow-xl"
            >
              🎉 أحسنت يا بطل
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.div
          animate={{
            scale:
              dadState === "talking"
                ? [1, 1.03, 1]
                : dadState === "thinking"
                ? [1, 0.98, 1]
                : 1,
            filter:
              dadState === "correct"
                ? [
                    "drop-shadow(0 0 0px gold)",
                    "drop-shadow(0 0 20px gold)",
                    "drop-shadow(0 0 0px gold)",
                  ]
                : dadState === "celebrating"
                ? [
                    "drop-shadow(0 0 0px #10b981)",
                    "drop-shadow(0 0 30px #10b981)",
                    "drop-shadow(0 0 0px #10b981)",
                  ]
                : "drop-shadow(0 10px 20px rgba(0,0,0,.25))",
          }}
          transition={{
            duration: 0.7,
            repeat: dadState === "idle" ? 0 : Infinity,
          }}
        >
          <Image
            src="/brand/dad-book.png"
            alt="ضاد"
            width={105}
            height={118}
            priority
            className="relative h-auto w-[82px] sm:w-[98px]"
          />
        </motion.div>

        {/* 4. إضافة النجوم والمؤثرات المتطايرة */}
        <AnimatePresence>
          {isCorrect ? (
            <>
              <motion.span
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1.2, x: 28, y: -32 }}
                exit={{ opacity: 0 }}
                className="absolute right-5 top-5 z-20 text-2xl"
              >
                ⭐
              </motion.span>

              <motion.span
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x: -30, y: -18 }}
                exit={{ opacity: 0 }}
                className="absolute left-5 top-8 z-20 text-xl"
              >
                ✨
              </motion.span>
            </>
          ) : null}

          {isCelebrating ? (
            <>
              {["🎉", "✨", "⭐", "🏆"].map((symbol, index) => (
                <motion.span
                  key={`${symbol}-${index}`}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.8],
                    x: index % 2 === 0 ? 35 : -35,
                    y: -30 - index * 12,
                  }}
                  transition={{
                    duration: 1.2,
                    delay: index * 0.1,
                  }}
                  className="absolute left-1/2 top-1/2 z-20 text-2xl"
                >
                  {symbol}
                </motion.span>
              ))}
            </>
          ) : null}
        </AnimatePresence>

        <span className="absolute -right-1 -top-1 flex h-8 min-w-8 items-center justify-center rounded-full bg-[#F4C542] px-2 text-xs font-black text-[#0B766E] shadow-md">
          ضاد
        </span>

        <span className="absolute bottom-2 left-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-md" />
      </motion.button>
    </div>
  );
}
