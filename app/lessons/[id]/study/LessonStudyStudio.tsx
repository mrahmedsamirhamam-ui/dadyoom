"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type Lesson = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
};

type Slide = {
  kind?: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  callout?: string;
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
  question?: string;
  answer?: string;
  narration?: string;
  seconds?: number;
};

type ApiResponse = {
  data?: Record<string, unknown>;
  provider?: string;
  cached?: boolean;
  error?: string;
};

type StudyTask =
  | "summary"
  | "slides"
  | "flashcards"
  | "study_guide"
  | "concept_map"
  | "video_storyboard"
  | "notebook_answer"
  | "custom_summary"
  | "custom_slides";

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : [];
}

function slideRows(value: unknown): Slide[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): Slide | null => {
      if (typeof raw !== "object" || raw === null) return null;

      const item = raw as Record<string, unknown>;
      const title = String(item.title ?? "").trim();

      if (!title) return null;

      return {
        kind:
          String(
            item.kind ?? "concept",
          ).trim() || "concept",
        title,
        subtitle:
          String(
            item.subtitle ?? "",
          ).trim() || undefined,
        bullets:
          strings(item.bullets),
        callout:
          String(
            item.callout ?? "",
          ).trim() || undefined,
        leftTitle:
          String(
            item.leftTitle ?? "",
          ).trim() || undefined,
        leftItems:
          strings(item.leftItems),
        rightTitle:
          String(
            item.rightTitle ?? "",
          ).trim() || undefined,
        rightItems:
          strings(item.rightItems),
        question:
          String(
            item.question ?? "",
          ).trim() || undefined,
        answer:
          String(
            item.answer ?? "",
          ).trim() || undefined,
        narration:
          String(
            item.narration ?? "",
          ).trim() || undefined,
        seconds:
          Number(
            item.seconds ?? 8,
          ),
      };
    })
    .filter((item): item is Slide => item !== null);
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (context.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  return lines;
}

function paintSlide(
  canvas: HTMLCanvasElement,
  item: Slide,
  index: number,
  total: number,
) {
  const context = canvas.getContext("2d");

  if (!context) return;

  context.direction = "rtl";
  context.fillStyle = index === 0 ? "#123f39" : "#fffdf8";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.textAlign = "right";
  context.fillStyle = index === 0 ? "#ffffff" : "#123f39";
  context.font = "bold 54px Arial";

  wrapText(context, item.title, 1040)
    .slice(0, 2)
    .forEach((line, lineIndex) => {
      context.fillText(line, 1160, 115 + lineIndex * 70);
    });

  context.font = "34px Arial";
  context.fillStyle = index === 0 ? "#f5e7c3" : "#403a31";

  let y = 285;

  for (const bullet of item.bullets.slice(0, 5)) {
    for (const line of wrapText(context, `• ${bullet}`, 1010).slice(0, 2)) {
      context.fillText(line, 1140, y);
      y += 52;
    }

    y += 18;
  }

  context.font = "20px Arial";
  context.fillStyle = index === 0 ? "#e7d3a5" : "#8d7d60";
  context.fillText(`ضاديوم • ${index + 1}/${total}`, 1160, 675);
}

export default function LessonStudyStudio({
  lesson,
}: {
  lesson: Lesson;
}) {
  const [tab, setTab] =
    useState<"summary" | "slides" | "notebook" | "video">("summary");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const [summary, setSummary] =
    useState<Record<string, unknown> | null>(() =>
      lesson.summary
        ? {
            shortSummary: lesson.summary,
            keyPoints: [],
            reviewQuestions: [],
          }
        : null,
    );
  const [customSummary, setCustomSummary] =
    useState<Record<string, unknown> | null>(null);
  const [cards, setCards] =
    useState<Array<{ front: string; back: string }>>([]);
  const [studyGuide, setStudyGuide] =
    useState<Record<string, unknown> | null>(null);
  const [conceptMap, setConceptMap] =
    useState<Record<string, unknown> | null>(null);
  const [deck, setDeck] = useState<Slide[]>([]);
  const [customDeck, setCustomDeck] = useState<Slide[]>([]);
  const [videoDeck, setVideoDeck] = useState<Slide[]>([]);
  const [notebook, setNotebook] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch(`/api/lessons/notebook?lessonId=${encodeURIComponent(lesson.id)}`)
      .then((response) => response.json())
      .then((payload: { notes?: string }) => {
        setNotebook(payload.notes ?? "");
      })
      .catch(() => undefined);
  }, [lesson.id]);

  async function generate(
    task: StudyTask,
    userQuestion = "",
  ) {
    setBusy(task);
    setStatus("ضاديوم يعمل على طلبك...");

    try {
      const response = await fetch("/api/lessons/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          task,
          question: userQuestion,
        }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "تعذر تشغيل الأداة.");
      }

      if (task === "summary") {
        setSummary(payload.data);
      } else if (task === "custom_summary") {
        setCustomSummary(payload.data);
      } else if (task === "slides") {
        setDeck(slideRows(payload.data.slides));
      } else if (task === "custom_slides") {
        setCustomDeck(slideRows(payload.data.slides));
      } else if (task === "flashcards") {
        const nextCards = Array.isArray(payload.data.cards)
          ? payload.data.cards
              .map((raw) => {
                if (typeof raw !== "object" || raw === null) return null;

                const item = raw as Record<string, unknown>;
                const front = String(item.front ?? "").trim();
                const back = String(item.back ?? "").trim();

                return front && back ? { front, back } : null;
              })
              .filter(
                (item): item is { front: string; back: string } =>
                  item !== null,
              )
          : [];

        setCards(nextCards);
      } else if (task === "study_guide") {
        setStudyGuide(payload.data);
      } else if (task === "concept_map") {
        setConceptMap(payload.data);
      } else if (task === "video_storyboard") {
        setVideoDeck(slideRows(payload.data.slides));
      } else {
        setAnswer(String(payload.data.answer ?? ""));
      }

      setStatus(
        `تم بواسطة ${payload.provider ?? "AI"}${
          payload.cached ? " • محفوظ مسبقًا" : ""
        }`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "حدث خطأ.");
    } finally {
      setBusy("");
    }
  }

  function selectTab(next: "summary" | "slides" | "notebook" | "video") {
    setTab(next);

    if (next === "slides" && deck.length === 0 && busy !== "slides") {
      void generate("slides");
    }

    if (next === "summary" && !summary && busy !== "summary") {
      void generate("summary");
    }
  }

  function downloadText(name: string, text: string) {
    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function summaryText(data: Record<string, unknown>) {
    return [
      String(data.shortSummary ?? ""),
      "",
      "النقاط الأساسية:",
      ...strings(data.keyPoints),
      "",
      "أسئلة المراجعة:",
      ...strings(data.reviewQuestions),
    ].join("\n");
  }

  async function saveNotebook() {
    setStatus("جارٍ حفظ الدفتر...");

    const response = await fetch("/api/lessons/notebook", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: lesson.id,
        notes: notebook,
      }),
    });

    setStatus(response.ok ? "تم حفظ دفتري." : "تعذر حفظ الدفتر.");
  }

  async function narration(text: string) {
    const response = await fetch("/api/dad-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text.slice(0, 2400),
        mood: "normal",
      }),
    });

    if (!response.ok) throw new Error("تعذر إنشاء الصوت.");

    return response.arrayBuffer();
  }

  async function makeVideo() {
    if (!videoDeck.length) {
      await generate("video_storyboard", videoPrompt);
      setStatus("تم إنشاء السيناريو من البرومبت؛ اضغط صنع الفيديو مرة أخرى.");
      return;
    }

    const canvas = canvasRef.current;

    if (
      !canvas ||
      typeof MediaRecorder === "undefined" ||
      typeof canvas.captureStream !== "function"
    ) {
      setStatus("استخدم Chrome أو Edge لتصدير الفيديو.");
      return;
    }

    // VIDEO_DAILY_GATE: creation only. Viewing/downloading an already
    // created video does not consume another allowance.
    const limitResponse = await fetch("/api/usage/consume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feature: "video_ai",
      }),
    });

    if (!limitResponse.ok) {
      setStatus(
        "استخدمت فيديوهات AI الخمسة اليوم. Plus يفتح صناعة الفيديو بلا حد يومي داخل ضاديوم.",
      );
      return;
    }

    setBusy("video-render");
    setStatus("جارٍ صنع فيديو الدرس...");

    try {
      const audioContext = new AudioContext();
      await audioContext.resume();

      const audioOut = audioContext.createMediaStreamDestination();
      const canvasStream = canvas.captureStream(30);
      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioOut.stream.getAudioTracks(),
      ]);

      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];

      const mime =
        candidates.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";

      const recorder = new MediaRecorder(
        combined,
        mime ? { mimeType: mime } : undefined,
      );

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(500);

      for (const [index, item] of videoDeck.entries()) {
        paintSlide(canvas, item, index, videoDeck.length);

        try {
          const bytes = await narration(
            item.narration ||
              [item.title, ...item.bullets].join(". "),
          );

          const decoded = await audioContext.decodeAudioData(bytes.slice(0));
          const source = audioContext.createBufferSource();

          source.buffer = decoded;
          source.connect(audioOut);
          source.connect(audioContext.destination);

          const ended = new Promise<void>((resolve) => {
            source.onended = () => resolve();
          });

          source.start();
          await ended;
        } catch {
          await wait(Math.max(4, item.seconds ?? 8) * 1000);
        }

        await wait(250);
      }

      recorder.stop();
      await stopped;

      const blob = new Blob(chunks, {
        type: recorder.mimeType || "video/webm",
      });

      if (videoUrl) URL.revokeObjectURL(videoUrl);

      setVideoUrl(URL.createObjectURL(blob));
      setStatus("تم صنع الفيديو ويمكن تشغيله أو تنزيله.");

      await audioContext.close();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "تعذر صنع الفيديو.",
      );
    } finally {
      setBusy("");
    }
  }

  return (
    <main
      dir="rtl"
      className="lesson-arabic-shell min-h-screen w-full min-w-0 overflow-x-hidden px-3 py-5 sm:px-5"
    >
      <div className="mx-auto w-full min-w-0 max-w-6xl space-y-5">
        <section className="dadyoom-course-pattern rounded-[2rem] p-6 text-white">
          <div className="text-sm font-black text-[#f5cf7a]">
            استوديو الدرس الذكي
          </div>
          <h1 className="mt-2 text-3xl font-black">{lesson.title}</h1>
          <p className="mt-2 leading-8">
            الدرس متاح كملخص وشرائح دائمًا، مع الطباعة والتنزيل. حدود Free تخص فقط إنشاء نسخ جديدة بالـAI والفيديو.
          </p>
          <Link
            href={`/lessons/${lesson.id}`}
            className="dadyoom-arabic-button mt-4 inline-flex rounded-xl px-4 py-2 font-black text-white"
          >
            العودة للدرس
          </Link>
        </section>

        <nav className="grid gap-2 rounded-[2rem] border bg-white p-3 sm:grid-cols-4">
          {[
            ["summary", "الملخص"],
            ["slides", "الشرائح"],
            ["notebook", "دفتري"],
            ["video", "اصنع فيديو"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                selectTab(value as "summary" | "slides" | "notebook" | "video")
              }
              className={`dadyoom-game-tab rounded-2xl px-4 py-3 font-black ${
                tab === value ? "is-active" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {status ? (
          <div className="rounded-2xl bg-[#fff7e8] p-3 font-bold">
            {status}
          </div>
        ) : null}

        {tab === "summary" ? (
          <section className="dadyoom-print-surface space-y-4 rounded-[2rem] border bg-white p-5">
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="dadyoom-sand-button rounded-xl px-4 py-2 font-black"
              >
                طباعة الملخص
              </button>
              {summary ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadText(
                      `${lesson.title}-ملخص.txt`,
                      summaryText(summary),
                    )
                  }
                  className="dadyoom-sand-button rounded-xl px-4 py-2 font-black"
                >
                  تنزيل الملخص
                </button>
              ) : null}
              <Action
                busy={busy === "custom_summary"}
                onClick={() => generate("custom_summary")}
              >
                اصنع ملخصًا جديدًا بالـAI
              </Action>
              <Action
                busy={busy === "flashcards"}
                onClick={() => generate("flashcards")}
              >
                بطاقات المذاكرة
              </Action>
              <Action
                busy={busy === "study_guide"}
                onClick={() => generate("study_guide")}
              >
                دليل المذاكرة
              </Action>
              <Action
                busy={busy === "concept_map"}
                onClick={() => generate("concept_map")}
              >
                خريطة المفاهيم
              </Action>
            </div>

            {summary ? (
              <div className="rounded-2xl bg-[#fffdf8] p-5">
                <h2 className="text-xl font-black text-[#123f39]">
                  ملخص الدرس
                </h2>
                <p className="mt-3 leading-9">
                  {String(summary.shortSummary ?? "")}
                </p>
                <List
                  title="النقاط الأساسية"
                  items={strings(summary.keyPoints)}
                />
                <List
                  title="أسئلة المراجعة"
                  items={strings(summary.reviewQuestions)}
                />
              </div>
            ) : (
              <Action
                busy={busy === "summary"}
                onClick={() => generate("summary")}
              >
                تحميل ملخص الدرس
              </Action>
            )}

            {customSummary ? (
              <div className="rounded-2xl border border-[#d7bd83] bg-[#fff8e8] p-5">
                <h2 className="text-xl font-black text-[#123f39]">
                  النسخة المخصصة بالـAI
                </h2>
                <p className="mt-3 leading-9">
                  {String(customSummary.shortSummary ?? "")}
                </p>
                <List
                  title="النقاط الأساسية"
                  items={strings(customSummary.keyPoints)}
                />
              </div>
            ) : null}

            {cards.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card, index) => (
                  <div
                    key={`${card.front}-${index}`}
                    className="rounded-2xl border bg-[#fff8e8] p-4"
                  >
                    <b>{card.front}</b>
                    <p className="mt-2 leading-7">{card.back}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {studyGuide ? (
              <JsonBlock title="دليل المذاكرة" data={studyGuide} />
            ) : null}

            {conceptMap ? (
              <JsonBlock title="خريطة المفاهيم" data={conceptMap} />
            ) : null}
          </section>
        ) : null}

        {tab === "slides" ? (
          <section className="dadyoom-print-surface rounded-[2rem] border bg-white p-5">
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="dadyoom-sand-button rounded-xl px-4 py-2 font-black"
              >
                طباعة الشرائح
              </button>
              <a
                href={`/api/lessons/${lesson.id}/pptx`}
                className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white"
              >
                تنزيل PowerPoint الدرس
              </a>
              <Action
                busy={busy === "custom_slides"}
                onClick={() => generate("custom_slides")}
              >
                اصنع عرضًا جديدًا بالـAI
              </Action>
            </div>

            {!deck.length ? (
              <div className="mt-5 rounded-2xl bg-[#fff7e8] p-4 font-bold">
                جارٍ تجهيز شرائح الدرس الأساسية...
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {deck.map((item, index) => (
                <SlideCard
                  key={`${item.title}-${index}`}
                  item={item}
                  index={index}
                  label="شريحة الدرس"
                />
              ))}
            </div>

            {customDeck.length ? (
              <div className="mt-8 border-t border-[#dac59a] pt-6">
                <h2 className="text-2xl font-black text-[#123f39]">
                  العرض المخصص بالـAI
                </h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {customDeck.map((item, index) => (
                    <SlideCard
                      key={`custom-${item.title}-${index}`}
                      item={item}
                      index={index}
                      label="شريحة مخصصة"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "notebook" ? (
          <section className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[2rem] border bg-white p-5">
              <h2 className="text-xl font-black">ملاحظاتي</h2>
              <textarea
                value={notebook}
                onChange={(event) => setNotebook(event.target.value)}
                rows={16}
                className="mt-4 w-full rounded-2xl border p-4 leading-8"
                placeholder="اكتب ملاحظاتك..."
              />
              <button
                type="button"
                onClick={saveNotebook}
                className="dadyoom-arabic-button mt-3 rounded-2xl px-5 py-3 font-black text-white"
              >
                حفظ دفتري
              </button>
            </article>

            <article className="rounded-[2rem] border bg-white p-5">
              <h2 className="text-xl font-black">اسأل الدرس</h2>
              <p className="mt-2 text-sm">
                الإجابة مرتبطة بمحتوى الدرس الحالي فقط.
              </p>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                className="mt-4 w-full rounded-2xl border p-4"
                placeholder="اسأل عن الدرس..."
              />
              <button
                type="button"
                disabled={!question.trim()}
                onClick={() => generate("notebook_answer", question)}
                className="dadyoom-arabic-button mt-3 rounded-2xl px-5 py-3 font-black text-white disabled:opacity-50"
              >
                اسأل دفتري
              </button>
              {answer ? (
                <div className="mt-4 rounded-2xl bg-[#eef8f4] p-4 leading-8">
                  {answer}
                </div>
              ) : null}
            </article>
          </section>
        ) : null}

        {tab === "video" ? (
          <section className="rounded-[2rem] border bg-white p-5">
            <div className="mb-5 rounded-2xl border border-[#d7bd83] bg-[#fff8e8] p-4">
              <label
                htmlFor="dadyoom-video-prompt"
                className="block text-lg font-black text-[#123f39]"
              >
                اكتب برومبت الفيديو بنفسك
              </label>
              <p className="mt-1 text-sm leading-7 text-[#756b5f]">
                لا تحتاج إلى اختيار درس من قائمة. اكتب وصف الفيديو الذي تريده، وسيستخدم ضاديوم البرومبت كما كتبته.
              </p>
              <textarea
                id="dadyoom-video-prompt"
                value={videoPrompt}
                onChange={(event) => {
                  setVideoPrompt(event.target.value);
                  setVideoDeck([]);
                }}
                rows={5}
                placeholder="مثال: أنشئ فيديو تعليمي مبسط يشرح الفكرة بأسلوب واضح، مع أمثلة قصيرة وتعليق صوتي عربي."
                className="mt-3 w-full rounded-2xl border border-[#d8c7a6] bg-white p-4 leading-8 outline-none focus:border-[#123f39]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Action
                busy={busy === "video_storyboard"}
                onClick={() => generate("video_storyboard", videoPrompt)}
              >
                تجهيز السيناريو من البرومبت
              </Action>
              <button
                type="button"
                disabled={busy === "video-render"}
                onClick={makeVideo}
                className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white disabled:opacity-50"
              >
                اصنع الفيديو بالـAI
              </button>
              {videoUrl ? (
                <a
                  href={videoUrl}
                  download={`${lesson.title}.webm`}
                  className="dadyoom-sand-button rounded-2xl px-5 py-3 font-black"
                >
                  تنزيل الفيديو
                </a>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-7 text-[#756b5f]">
              إنشاء الفيديو الجديد يحسب من حد Free اليومي. تشغيل الفيديو أو تنزيله بعد إنشائه لا يخصم محاولة أخرى.
            </p>

            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="mt-5 aspect-video w-full max-w-4xl rounded-2xl border"
            />

            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="mt-5 w-full max-w-4xl rounded-2xl"
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function SlideCard({
  item,
  index,
  label,
}: {
  item: Slide;
  index: number;
  label: string;
}) {
  const hasCompare =
    Boolean(
      item.leftItems?.length,
    ) &&
    Boolean(
      item.rightItems?.length,
    );

  return (
    <div className="aspect-video min-w-0 overflow-hidden rounded-2xl border border-[#dcc899] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3 text-xs font-black text-[#9f7426]">
        <span>
          {label} {index + 1}
        </span>
        <span>
          {item.kind ??
            "concept"}
        </span>
      </div>

      <h2 className="mt-2 line-clamp-2 text-xl font-black text-[#123f39] sm:text-2xl">
        {item.title}
      </h2>

      {item.subtitle ? (
        <p className="mt-1 line-clamp-2 text-xs font-bold text-[#756b5f] sm:text-sm">
          {item.subtitle}
        </p>
      ) : null}

      {item.callout ? (
        <div className="mt-3 line-clamp-3 rounded-xl border border-[#a8cbbf] bg-[#eef8f4] p-3 text-xs font-black leading-6 text-[#173f38] sm:text-sm">
          {item.callout}
        </div>
      ) : null}

      {hasCompare ? (
        <div className="mt-3 grid min-h-0 grid-cols-2 gap-2 text-[11px] sm:gap-3 sm:text-sm">
          <div className="min-w-0 rounded-xl bg-[#fff3d7] p-2 sm:p-3">
            <div className="font-black text-[#70551e]">
              {item.leftTitle ??
                "الجانب الأول"}
            </div>
            <ul className="mt-2 space-y-1 leading-5 sm:leading-6">
              {item.leftItems
                ?.slice(0, 3)
                .map((row) => (
                  <li
                    key={row}
                    className="line-clamp-2"
                  >
                    • {row}
                  </li>
                ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-xl bg-[#eef8f4] p-2 sm:p-3">
            <div className="font-black text-[#173f38]">
              {item.rightTitle ??
                "الجانب الثاني"}
            </div>
            <ul className="mt-2 space-y-1 leading-5 sm:leading-6">
              {item.rightItems
                ?.slice(0, 3)
                .map((row) => (
                  <li
                    key={row}
                    className="line-clamp-2"
                  >
                    • {row}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      ) : null}

      {item.question ? (
        <div className="mt-3 line-clamp-3 rounded-xl bg-[#123f39] p-3 text-xs font-black leading-6 text-white sm:text-sm">
          {item.question}
        </div>
      ) : null}

      {item.answer ? (
        <div className="mt-2 line-clamp-2 text-xs font-bold leading-6 text-[#755f30] sm:text-sm">
          {item.answer}
        </div>
      ) : null}

      {!hasCompare ? (
        <ul className="mt-3 list-disc space-y-1 overflow-hidden pr-5 text-xs leading-5 sm:text-sm sm:leading-6">
          {item.bullets
            .slice(0, 5)
            .map(
              (bullet) => (
                <li
                  key={bullet}
                  className="line-clamp-2"
                >
                  {bullet}
                </li>
              ),
            )}
        </ul>
      ) : null}
    </div>
  );
}

function Action({
  children,
  busy,
  onClick,
}: {
  children: React.ReactNode;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white disabled:opacity-50"
    >
      {busy ? "جارٍ العمل..." : children}
    </button>
  );
}

function List({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <div className="mt-4">
      <h3 className="font-black">{title}</h3>
      <ul className="mt-2 list-disc space-y-2 pr-6 leading-8">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function JsonBlock({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown>;
}) {
  return (
    <article className="rounded-2xl border bg-[#fffdf8] p-5">
      <h2 className="text-xl font-black">{title}</h2>
      <pre className="mt-3 whitespace-pre-wrap break-words font-arabic-reading leading-8">
        {JSON.stringify(data, null, 2)}
      </pre>
    </article>
  );
}