"use client";

import { AnimatePresence, motion } from "motion/react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DadRobot from "@/components/dad-ai/DadRobot";
import DadBrain from "@/components/dad/services/DadBrain";
import { DAD_LESSON_CONTEXT_EVENT, type DadLessonContextPayload } from "@/components/dad-ai/DadLessonContext";
import { useDadState } from "@/hooks/use-dad-state";
import { DadAI, DadVoice } from "@/services/dad-ai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type CompanionMode = "chat" | "check-understanding" | "lesson-completed";

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

const quickPrompts = [
  "اشرحها ببساطة",
  "أعطني مثالًا",
  "اختبر فهمي",
];

export default function DadCompanion({
  studentName = "يا بطل",
  pageTitle = "ضاديوم",
  lessonTitle = "",
  lessonContent = "",
}: DadCompanionProps) {
  const dadState = useDadState();
  const brain = useMemo(() => new DadBrain(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [context, setContext] = useState<DadLessonContextPayload>({
    pageTitle,
    lessonTitle,
    lessonContent,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `مرحبًا ${studentName} 👋 أنا ضاد. اسألني عن الدرس أو كلمة أو قاعدة، وسأساعدك خطوة بخطوة.`,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  const requestLockRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    function handleContext(event: Event) {
      const customEvent = event as CustomEvent<DadLessonContextPayload>;
      if (!customEvent.detail) return;
      setContext(customEvent.detail);
    }

    window.addEventListener(DAD_LESSON_CONTEXT_EVENT, handleContext);
    return () => window.removeEventListener(DAD_LESSON_CONTEXT_EVENT, handleContext);
  }, []);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      requestLockRef.current = false;
    };
  }, []);

  const requestCompanionResponse = useCallback(
    async (message: string, mode: CompanionMode, conversationOverride?: Message[]) => {
      if (requestLockRef.current) return;

      requestLockRef.current = true;
      setIsLoading(true);
      DadAI.think();

      const controller = new AbortController();
      requestControllerRef.current = controller;

      try {
        const conversation = conversationOverride ?? messagesRef.current;
        const response = await brain.ask(
          {
            message,
            mode,
            pageTitle: context.pageTitle || pageTitle,
            lessonTitle: context.lessonTitle || lessonTitle,
            lessonContent: context.lessonContent || lessonContent,
            history: conversation,
          },
          { signal: controller.signal }
        );

        const reply = response.reply;
        setMessages((current) => [...current, { role: "assistant", content: reply }]);
        DadAI.talk();

        if (voiceEnabled) {
          await DadVoice.speak(reply, { mood: "normal" }).catch(() => undefined);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const errorMessage = error instanceof Error ? error.message : "تعذر التواصل مع ضاد.";
        setMessages((current) => [...current, { role: "assistant", content: errorMessage }]);
        DadAI.error();
      } finally {
        requestControllerRef.current = null;
        requestLockRef.current = false;
        DadAI.idle();
        setIsLoading(false);
      }
    },
    [brain, context, lessonContent, lessonTitle, pageTitle, voiceEnabled]
  );

  useEffect(() => {
    function handleLessonCompleted(event: Event) {
      const customEvent = event as LessonCompletedEvent;
      const completionText = customEvent.detail?.alreadyCompleted
        ? "أحسنت! راجعت درسًا أتممته من قبل، وهذه مراجعة ذكية."
        : "رائع! أنهيت الدرس وحققت خطوة جديدة في رحلتك.";

      setMessages((current) => [...current, { role: "assistant", content: completionText }]);
      setIsOpen(true);
      DadAI.celebrate();
      if (voiceEnabled) void DadVoice.speak(completionText, { mood: "celebrating" }).catch(() => undefined);
      window.setTimeout(() => DadAI.idle(), 2600);
    }

    window.addEventListener("dadyoom:lesson-completed", handleLessonCompleted);
    return () => window.removeEventListener("dadyoom:lesson-completed", handleLessonCompleted);
  }, [voiceEnabled]);

  async function submitText(text: string) {
    const cleanInput = text.trim();
    if (!cleanInput || requestLockRef.current) return;

    DadAI.listen();
    const userMessage: Message = { role: "user", content: cleanInput };
    const updatedConversation = [...messagesRef.current, userMessage];
    setMessages(updatedConversation);
    setInput("");
    await requestCompanionResponse(cleanInput, cleanInput === "اختبر فهمي" ? "check-understanding" : "chat", updatedConversation);
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitText(input);
  }

  const hasLessonContext = Boolean(context.lessonTitle && context.lessonContent);

  return (
    <div dir="rtl" className="fixed bottom-4 left-4 z-[9999] sm:bottom-6 sm:left-6">
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            key="dad-chat"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mb-4 flex h-[min(600px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[410px] flex-col overflow-hidden rounded-[2rem] border border-[#d7c391] bg-[#fffdf8] shadow-2xl shadow-[#123f39]/20"
          >
            <header className="relative overflow-hidden bg-gradient-to-l from-[#123f39] via-[#17564d] to-[#1f665c] px-5 py-4 text-white">
              <div aria-hidden="true" className="absolute inset-0 opacity-15 dad-arabesque" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <DadRobot state={dadState} size={60} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-arabic-display text-xl font-black">ضاد</h2>
                      <span className="rounded-full bg-[#f5cf7a] px-2 py-0.5 text-[9px] font-black text-[#523b10]">رفيق العربية</span>
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-[#dcece7]">
                      {hasLessonContext ? `معك في: ${context.lessonTitle}` : "اسأل، افهم، ثم جرّب بنفسك"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setVoiceEnabled((value) => !value)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-sm transition hover:bg-white/20"
                    aria-label={voiceEnabled ? "إيقاف صوت ضاد" : "تشغيل صوت ضاد"}
                    title={voiceEnabled ? "الصوت يعمل" : "الصوت متوقف"}
                  >
                    {voiceEnabled ? "🔊" : "🔇"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/12 text-lg transition hover:bg-white/20"
                    aria-label="إغلاق ضاد"
                  >
                    ×
                  </button>
                </div>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8f1e4] p-4">
              {hasLessonContext ? (
                <div className="rounded-2xl border border-[#d7c391] bg-[#fff8e8] px-4 py-3 text-xs font-bold leading-6 text-[#6e572c]">
                  📖 ضاد يقرأ سياق هذا الدرس الآن، لذلك يمكنه الشرح منه بدل الإجابة العامة فقط.
                </div>
              ) : null}

              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 font-arabic-reading text-[15px] leading-7 ${
                      message.role === "user"
                        ? "rounded-bl-sm bg-[#174f47] text-white"
                        : "rounded-br-sm border border-[#e4d8c1] bg-white text-[#4a433b] shadow-sm"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading ? (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-sm border border-[#ded1b7] bg-white px-4 py-3 text-sm font-black text-[#6d604e] shadow-sm">
                    <span className="inline-flex gap-1" aria-label="ضاد يفكر">
                      <span className="dad-dot">•</span><span className="dad-dot [animation-delay:120ms]">•</span><span className="dad-dot [animation-delay:240ms]">•</span>
                    </span>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#e2d4b8] bg-[#fffdf8] p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void submitText(prompt)}
                    className="shrink-0 rounded-full border border-[#d8c493] bg-[#fff8e8] px-3 py-2 text-[11px] font-black text-[#72551c] transition hover:border-[#b98a35] hover:bg-[#fff1cf] disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      if (!isLoading) void submitText(input);
                    }
                  }}
                  rows={1}
                  maxLength={2400}
                  placeholder={hasLessonContext ? "اسأل ضاد عن هذا الدرس…" : "اكتب سؤالك بالعربية…"}
                  className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-[#d9c9aa] bg-white px-4 py-3 text-sm leading-6 text-[#3f3931] outline-none transition focus:border-[#39796e] focus:ring-4 focus:ring-[#174f47]/10"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="grid h-11 w-12 shrink-0 place-items-center rounded-2xl bg-[#123f39] text-lg font-black text-[#f5cf7a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="إرسال إلى ضاد"
                >
                  ←
                </button>
              </form>
              <p className="mt-2 text-center text-[9px] font-bold text-[#9a8c77]">ضاد يساعدك على الفهم، وقد يطلب منك المحاولة قبل إعطاء الحل.</p>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        <AnimatePresence>
          {!isOpen ? (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="hidden rounded-2xl border border-[#decda9] bg-[#fffdf8] px-3 py-2 text-right shadow-lg sm:block"
            >
              <div className="text-xs font-black text-[#123f39]">اسأل ضاد</div>
              <div className="mt-0.5 max-w-36 text-[10px] font-bold text-[#8b7c68]">{hasLessonContext ? "أنا معك في هذا الدرس" : "رفيق العربية في كل صفحة"}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="relative grid h-[82px] w-[82px] place-items-center rounded-[1.8rem] border border-[#d3ba7e] bg-[#fffdf8] shadow-2xl shadow-[#123f39]/20"
          aria-label={isOpen ? "إغلاق ضاد" : "فتح ضاد"}
        >
          <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#fffdf8] bg-[#2f9f72]" />
          <DadRobot state={dadState} size={66} />
        </motion.button>
      </div>
    </div>
  );
}
