"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DadCharacter } from "@/components/dad";
import DadBrain from "@/components/dad/services/DadBrain";
import { useDadState } from "@/hooks/use-dad-state";
import { DadAI, DadVoice } from "@/services/dad-ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type CompanionMode =
  | "chat"
  | "check-understanding"
  | "lesson-completed";

type DadCompanionProps = {
  studentName?: string;
  pageTitle?: string;
  lessonTitle?: string;
  lessonContent?: string;
};

type LessonCompletedEvent = CustomEvent<{
  lessonId?: string;
  alreadyCompleted?: boolean;
}>;

type DadBubbleData = {
  text: string;
  icon: string;
  className: string;
};

function getBubbleData(
  state: ReturnType<typeof useDadState>
): DadBubbleData | null {
  switch (state) {
    case "thinking":
      return {
        text: "أفكر قليلًا...",
        icon: "🤔",
        className:
          "border-violet-200 bg-violet-50 text-violet-800",
      };

    case "talking":
      return {
        text: "أتحدث الآن",
        icon: "🗣️",
        className:
          "border-sky-200 bg-sky-50 text-sky-800",
      };

    case "correct":
      return {
        text: "إجابة رائعة!",
        icon: "⭐",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
      };

    case "encouraging":
      return {
        text: "حاول مرة أخرى",
        icon: "💪",
        className:
          "border-amber-200 bg-amber-50 text-amber-800",
      };

    case "celebrating":
      return {
        text: "أحسنت يا بطل!",
        icon: "🎉",
        className:
          "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
      };

    case "listening":
      return {
        text: "أستمع إليك",
        icon: "👂",
        className:
          "border-teal-200 bg-teal-50 text-teal-800",
      };

    case "reading":
      return {
        text: "أقرأ معك",
        icon: "📖",
        className:
          "border-indigo-200 bg-indigo-50 text-indigo-800",
      };

    case "error":
      return {
        text: "حدث خطأ",
        icon: "⚠️",
        className:
          "border-rose-200 bg-rose-50 text-rose-800",
      };

    default:
      return null;
  }
}

export default function DadCompanion({
  studentName = "يا بطل",
  pageTitle = "ضاديوم",
  lessonTitle = "",
  lessonContent = "",
}: DadCompanionProps) {
  const dadState = useDadState();

  // إنشاء كائن DadBrain مرة واحدة واستخدامه عبر دورة حياة المكون
  const brain = useMemo(() => new DadBrain(), []);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `مرحبًا ${studentName} 👋 أنا ضاد، رفيقك في رحلة العربية. أنا هنا عندما تحتاج إلى شرح أو سؤال سريع.`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    function handleVoiceStart(): void {
      DadAI.talk();
    }

    function handleVoiceEnd(): void {
      if (DadAI.getState() === "talking") {
        DadAI.idle();
      }
    }

    window.addEventListener(
      "dadyoom:voice-start",
      handleVoiceStart
    );

    window.addEventListener(
      "dadyoom:voice-end",
      handleVoiceEnd
    );

    return () => {
      window.removeEventListener(
        "dadyoom:voice-start",
        handleVoiceStart
      );

      window.removeEventListener(
        "dadyoom:voice-end",
        handleVoiceEnd
      );
    };
  }, []);

  const requestCompanionResponse = useCallback(
    async (
      message: string,
      mode: CompanionMode,
      conversationOverride?: Message[]
    ) => {
      setIsLoading(true);

      // 1. بدء التفكير
      DadAI.think();

      try {
        const conversation =
          conversationOverride ?? messagesRef.current;

        // 2. طلب الرد عبر DadBrain
        const response = await brain.ask({
          message,
          mode,
          pageTitle,
          lessonTitle,
          lessonContent,
          history: conversation,
        });

        const reply =
          response?.reply ||
          (typeof response === "string" ? response : null) ||
          "أحسنت! هل تريد سؤالًا سريعًا للتأكد من فهم الدرس؟";

        const assistantMessage: Message = {
          role: "assistant",
          content: reply,
        };

        setMessages((current) => [
          ...current,
          assistantMessage,
        ]);

        // 3. لبدء التحدث
        DadAI.talk();

        // 4. نطق الإجابة والتأكد من إتمام الصوت
        await DadVoice.speak(reply, {
          mood: "normal",
        }).catch((error) => {
          console.error("Companion voice error:", error);
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "تعذر التواصل مع ضاد.";

        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: errorMessage,
          },
        ]);

        DadAI.error();

        window.setTimeout(() => {
          if (DadAI.getState() === "error") {
            DadAI.idle();
          }
        }, 2200);
      } finally {
        // 5. العودة لحالة الاستقرار بعد انتهاء التحدث أو عند حدوث خطأ
        DadAI.idle();
        setIsLoading(false);
      }
    },
    [brain, lessonContent, lessonTitle, pageTitle]
  );

  useEffect(() => {
    function handleLessonCompleted(event: Event) {
      const customEvent = event as LessonCompletedEvent;

      console.info(
        "DAD_COMPANION_LESSON_COMPLETED:",
        customEvent.detail
      );

      const completionText =
        customEvent.detail?.alreadyCompleted
          ? "أحسنت يا بطل! لقد أتممت هذا الدرس من قبل، ومراجعتك اليوم خطوة رائعة."
          : "رائع يا بطل! لقد أنهيت الدرس بنجاح وحققت تقدمًا جديدًا.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: completionText,
        },
      ]);

      setIsOpen(true);
      DadAI.celebrate();

      void DadVoice.speak(completionText, {
        mood: "celebrating",
      }).catch((error) => {
        console.error(
          "Lesson completion voice error:",
          error
        );
      });

      window.setTimeout(() => {
        if (DadAI.getState() === "celebrating") {
          DadAI.idle();
        }
      }, 3500);
    }

    window.addEventListener(
      "dadyoom:lesson-completed",
      handleLessonCompleted
    );

    return () => {
      window.removeEventListener(
        "dadyoom:lesson-completed",
        handleLessonCompleted
      );
    };
  }, []);

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanInput = input.trim();

    if (!cleanInput || isLoading) {
      return;
    }

    DadAI.listen();

    const userMessage: Message = {
      role: "user",
      content: cleanInput,
    };

    const updatedConversation = [
      ...messagesRef.current,
      userMessage,
    ];

    setMessages(updatedConversation);
    setInput("");

    await requestCompanionResponse(
      cleanInput,
      "chat",
      updatedConversation
    );
  }

  async function checkUnderstanding() {
    if (isLoading) {
      return;
    }

    DadAI.listen();

    const text =
      "أعطني سؤالًا سريعًا للتأكد من أنني فهمت الدرس.";

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const updatedConversation = [
      ...messagesRef.current,
      userMessage,
    ];

    setMessages(updatedConversation);

    await requestCompanionResponse(
      text,
      "check-understanding",
      updatedConversation
    );
  }

  async function askIfUnderstood() {
    if (isLoading) {
      return;
    }

    DadAI.listen();

    const text =
      "ساعدني في التأكد من أنني فهمت الدرس.";

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const updatedConversation = [
      ...messagesRef.current,
      userMessage,
    ];

    setMessages(updatedConversation);

    await requestCompanionResponse(
      text,
      "check-understanding",
      updatedConversation
    );
  }

  async function explainSimply() {
    if (isLoading) {
      return;
    }

    DadAI.listen();

    const text =
      "اشرح لي أهم فكرة في هذا الدرس بطريقة سهلة ومختصرة.";

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const updatedConversation = [
      ...messagesRef.current,
      userMessage,
    ];

    setMessages(updatedConversation);

    await requestCompanionResponse(
      text,
      "chat",
      updatedConversation
    );
  }

  const bubbleData = getBubbleData(dadState);

  return (
    <div
      dir="rtl"
      className="fixed bottom-5 left-5 z-[9999]"
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            key="dad-chat"
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.94,
            }}
            transition={{
              duration: 0.22,
              ease: "easeOut",
            }}
            className="mb-4 flex h-[520px] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between bg-gradient-to-l from-teal-800 to-teal-600 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <DadCharacter
                  state={dadState}
                  size={54}
                />

                <div>
                  <h2 className="font-black">
                    ضاد
                  </h2>

                  <p className="text-xs text-teal-100">
                    رفيقك في رحلة العربية
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg transition hover:bg-white/25"
                aria-label="إغلاق ضاد"
              >
                ×
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.map(
                (message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                        message.role === "user"
                          ? "rounded-bl-sm bg-teal-700 text-white"
                          : "rounded-br-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                )
              )}

              {isLoading ? (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-sm bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    <span className="ml-2">
                      ضاد يفكر
                    </span>

                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map(
                        (index) => (
                          <motion.span
                            key={index}
                            animate={{
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 0.7,
                              repeat: Infinity,
                              delay:
                                index * 0.12,
                            }}
                            className="h-1.5 w-1.5 rounded-full bg-teal-600"
                          />
                        )
                      )}
                    </span>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-100 bg-white p-3">
              <div className="mb-3 flex flex-wrap gap-2">
                <QuickButton
                  label="هل فهمت الدرس؟"
                  disabled={isLoading}
                  onClick={() => {
                    void askIfUnderstood();
                  }}
                />

                <QuickButton
                  label="اسألني سؤالًا"
                  disabled={isLoading}
                  onClick={() => {
                    void checkUnderstanding();
                  }}
                />

                <QuickButton
                  label="اشرح ببساطة"
                  disabled={isLoading}
                  onClick={() => {
                    void explainSimply();
                  }}
                />
              </div>

              <form
                onSubmit={sendMessage}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  placeholder="اكتب رسالتك إلى ضاد..."
                  disabled={isLoading}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !input.trim()
                  }
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-700 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="إرسال"
                >
                  ←
                </button>
              </form>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <div className="relative flex items-end gap-2">
        <AnimatePresence mode="wait">
          {!isOpen && bubbleData ? (
            <motion.div
              key={dadState}
              initial={{
                opacity: 0,
                y: 12,
                scale: 0.88,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.90,
              }}
              className={`mb-4 max-w-[220px] rounded-2xl rounded-bl-sm border px-4 py-3 text-right text-sm font-black shadow-xl ${bubbleData.className}`}
            >
              <span className="ml-1">
                {bubbleData.icon}
              </span>

              {bubbleData.text}
            </motion.div>
          ) : !isOpen ? (
            <motion.div
              key="idle-help"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 hidden max-w-[220px] rounded-2xl rounded-bl-sm border border-teal-100 bg-white px-4 py-3 text-right text-sm font-semibold text-slate-700 shadow-lg sm:block"
            >
              أنا هنا عندما تحتاج إلى
              مساعدة 👋
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() =>
            setIsOpen(
              (current) => !current
            )
          }
          whileHover={{
            scale: 1.06,
          }}
          whileTap={{
            scale: 0.94,
          }}
          className="group relative"
          aria-label="فتح رفيق ضاد"
          aria-expanded={isOpen}
        >
          <DadCharacter
            state={dadState}
            size={145}
          />
        </motion.button>
      </div>
    </div>
  );
}

function QuickButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}