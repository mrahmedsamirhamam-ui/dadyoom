"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Message = { id: string; text: string; createdAt: string; isMine: boolean; isTeacher: boolean };
type Board = { text: string; updatedAt: string };
type Result = { ok: boolean; title?: string; isTeacher?: boolean; messages?: Message[]; board?: Board | null; error?: string };

export default function DadyoomNativeClassroom({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState("غرفة ضاديوم التعليمية");
  const [isTeacher, setIsTeacher] = useState(false);
  const [text, setText] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [boardDraft, setBoardDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    const load = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/live/native/" + sessionId, {
          cache: "no-store", credentials: "same-origin", signal: abort.signal,
        });
        const result = (await response.json()) as Result;
        if (!response.ok || !result.ok) {
          setError(result.error ?? "تعذر دخول الغرفة.");
          return;
        }
        setMessages(result.messages ?? []);
        setBoard(result.board ?? null);
        setTitle(result.title ?? "غرفة ضاديوم التعليمية");
        setIsTeacher(Boolean(result.isTeacher));
        setError("");
        setReady(true);
      } catch {
        if (!abort.signal.aborted) setError("تعذر الاتصال بغرفة ضاديوم.");
      }
    };
    void load();
    const poll = window.setInterval(() => { void load(); }, 10000);
    return () => { abort.abort(); window.clearInterval(poll); };
  }, [sessionId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/live/native/" + sessionId, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Dadyoom-Native-Classroom": "1" },
        credentials: "same-origin",
        body: JSON.stringify({ text }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "تعذر إرسال الرسالة.");
        return;
      }
      setText("");
      setError("");
      // Load the authoritative server snapshot after a confirmed receipt.
      const current = await fetch("/api/live/native/" + sessionId, { cache: "no-store" });
      if (current.ok) {
        const fresh = (await current.json()) as Result;
        if (fresh.ok) {
          setMessages(fresh.messages ?? []);
          setBoard(fresh.board ?? null);
        }
      }
    } catch {
      setError("تعذر الاتصال بالخادم؛ لم نؤكد إرسال الرسالة.");
    } finally {
      setBusy(false);
    }
  }


  async function publishBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isTeacher || !ready || busy || !boardDraft.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/live/native/" + sessionId, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Dadyoom-Native-Classroom": "1" },
        credentials: "same-origin",
        body: JSON.stringify({ text: boardDraft, kind: "board" }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "تعذر نشر السبورة.");
        return;
      }
      const fresh = await fetch("/api/live/native/" + sessionId, {
        credentials: "same-origin", cache: "no-store",
      });
      const result = (await fresh.json()) as Result;
      if (!fresh.ok || !result.ok) {
        setError("تم حفظ السبورة لكن تعذر تحديث عرضها.");
        return;
      }
      setBoard(result.board ?? null);
      setMessages(result.messages ?? []);
      setBoardDraft("");
      setError("");
    } catch {
      setError("تعذر الاتصال بالخادم؛ لم نؤكد حفظ السبورة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#f7f1e6] px-4 py-7 text-[#123f39]">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl bg-[#123f39] p-6 text-white">
          <p className="text-sm font-black text-[#f2d896]">ضاديوم Classroom — التواصل التعليمي الخاص بنا</p>
          <h1 className="mt-2 text-2xl font-black">{title}</h1>
          <p className="mt-2 leading-7">
            نقاش وأسئلة وسبورة مباشرة داخل غرفة ضاديوم الخاصة. للخصوصية، لا تشارك بياناتك الشخصية أو صور زملائك.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
            <Link href="/courses" className="rounded-full border border-white/40 px-4 py-2">الدروس ←</Link>
            <span role="note" className="rounded-full border border-[#f3d896]/60 px-4 py-2 text-[#f3d896]">
              الصوت والفيديو قيد تطوير ضاديوم — لا يتوفران داخل الغرفة الآن
            </span>
          </div>
        </header>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 font-bold text-red-800">{error}</p>}
        <section aria-label="سبورة ضاديوم" className="rounded-3xl border border-[#dccbad] bg-white p-5">
          <h2 className="text-xl font-black">سبورة المعلم — موضوع الحصة</h2>
          <p className="mt-2 text-sm text-[#706453]">المعلم وحده ينشر الشرح أو السؤال، ويظهر للمشاركين المصرح لهم عند التحديث. النص محفوظ ومقيدًا بصلاحيات الحصة.</p>
          <div className="mt-4 min-h-24 rounded-2xl border border-[#bfcbb6] bg-[#eaf3e9] p-5">
            {board ? <p className="whitespace-pre-wrap break-words text-lg leading-9">{board.text}</p> :
              <p className="text-sm text-[#6d6656]">لم ينشر المعلم محتوى السبورة بعد.</p>}
          </div>
          {isTeacher ? <form onSubmit={publishBoard} className="mt-4 space-y-3">
            <label htmlFor="native-board-draft" className="font-black">نص السبورة الجديد</label>
            <textarea id="native-board-draft" rows={4} maxLength={1200}
              value={boardDraft} onChange={event => setBoardDraft(event.target.value)}
              className="w-full rounded-xl border border-[#cab994] p-3"
              placeholder="اكتب هدف الدرس أو سؤالًا أو خطوات النشاط…" />
            <button type="submit" disabled={!ready || busy || !boardDraft.trim()}
              className="rounded-xl bg-[#123f39] px-5 py-3 font-black text-white disabled:opacity-40">
              {busy ? "جارٍ النشر…" : "انشر على سبورة الحصة"}
            </button>
          </form> : null}
        </section>
        <section aria-label="رسائل الحصة" className="rounded-3xl border border-[#dccbad] bg-white p-5">
          <h2 className="text-lg font-black">المناقشة الصفية {isTeacher ? "— حساب المعلم" : ""}</h2>
          <p className="mt-2 text-sm text-[#6d6050]">تتجدد الرسائل كل عشر ثوانٍ عند فتح الصفحة. الغرفة للمشاركين المصرح لهم فقط.</p>
          <ol aria-live="polite" className="mt-4 max-h-[60vh] min-h-48 space-y-3 overflow-y-auto">
            {messages.map(msg => <li key={msg.id} className="rounded-xl border border-[#e7dcc7] bg-[#fffaf0] p-3">
              <div className="mb-1 text-xs font-black text-[#836634]">{msg.isMine ? "أنا" : msg.isTeacher ? "المعلم" : "مشارك"}</div>
              <p className="whitespace-pre-wrap break-words leading-7">{msg.text}</p>
            </li>)}
            {!messages.length && <li className="text-sm text-[#6b5e4f]">
              لم تبدأ المناقشة بعد. اكتب سؤالًا أو نشاطًا عندما تكون الغرفة جاهزة.
            </li>}
          </ol>
        </section>
        <form onSubmit={send} className="rounded-3xl border border-[#dccbad] bg-white p-5">
          <label htmlFor="native-classroom-message" className="font-black">رسالتك أو إجابتك</label>
          <textarea id="native-classroom-message" value={text} maxLength={1500}
            onChange={event => setText(event.target.value)} rows={3}
            className="mt-3 w-full rounded-xl border border-[#cab994] p-3"
            placeholder="اكتب سؤالًا عن الدرس أو إجابة على سؤال المعلم…" />
          <button disabled={!ready || busy || !text.trim()} type="submit"
            className="mt-3 rounded-xl bg-[#123f39] px-6 py-3 font-black text-white disabled:opacity-40">
            {busy ? "جارٍ الإرسال…" : "إرسال للمشاركين"}
          </button>
        </form>
      </div>
    </main>
  );
}
