"use client";
import { useState } from "react";
import { approvedPack, GAME_MODES } from "@/lib/games/lesson-game-pack";
const labels = { maze: "متاهة الأبواب", defender: "حارس القلعة", catcher: "صائد البالونات", runner: "سباق المسارات", guardian: "كنز البطاقات" };

export default function GamePackReviewClient() {
  const [lessonId, setLessonId] = useState("");
  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [aiAssisted, setAiAssisted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  let candidate: unknown = null;
  try { candidate = JSON.parse(text); } catch { /* show validation message */ }
  const pack = approvedPack(candidate);

  async function load() {
    if (!lessonId.trim()) return;
    setBusy(true); setMessage(""); setConfirmed(false);
    try {
      const response = await fetch("/api/lessons/games?lessonId=" + encodeURIComponent(lessonId), { cache: "no-store" });
      const data = await response.json() as { pack?: unknown; error?: string };
      if (!response.ok || !data.pack) throw new Error(data.error ?? "لم نجد الألعاب.");
      setText(JSON.stringify(data.pack, null, 2));
      setMessage("تم تحميل مقترح الأسئلة. راجع الأسئلة والإجابات وغيّرها عند الحاجة.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر تحميل الألعاب."); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!pack || !confirmed || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/lessons/games", {
        method: "PUT", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Dadyoom-Approved-Game-Pack": "1" },
        body: JSON.stringify({ lessonId, pack, approved: true, aiAssisted }),
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      setMessage(response.ok && data.ok
        ? "نجح اعتماد ونشر الألعاب الخمس لهذا الدرس."
        : data.error ?? "تعذر النشر.");
      if (response.ok && data.ok) setConfirmed(false);
    } catch { setMessage("تعذر الاتصال بالخادم ولم يتم تأكيد النشر."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5">
    <section className="rounded-3xl bg-white p-5">
      <label htmlFor="game-lesson-id" className="block font-black">معرّف الدرس (UUID)</label>
      <input id="game-lesson-id" value={lessonId} onChange={e => setLessonId(e.target.value)}
        className="mt-2 w-full rounded-xl border p-3 font-mono" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
      <button type="button" onClick={() => void load()} disabled={busy || !lessonId.trim()}
        className="mt-3 rounded-xl bg-[#123f39] px-5 py-3 font-black text-white disabled:opacity-50">حمّل بنك أسئلة الدرس</button>
      <p className="mt-2 text-sm leading-7">عدّل الحزمة يدويًا أو ألصق مقترح JSON من ذكاء ضاديوم. يجب أن تحتوي كل لعبة على خمسة أسئلة فريدة بإجابة موجودة ضمن الاختيارات.</p>
    </section>
    <section className="rounded-3xl bg-white p-5">
      <label htmlFor="game-json" className="block font-black">بيانات الألعاب الخمس القابلة للتعديل</label>
      <textarea id="game-json" rows={16} spellCheck={false}
        value={text} onChange={e => {setText(e.target.value);setConfirmed(false);}}
        className="mt-3 w-full rounded-xl border p-4 font-mono text-xs" placeholder='{"maze":[{"prompt":"...","options":["..."],"answer":"..."}]}'/>
      <p role="status" className={"mt-3 font-bold " + (pack ? "text-emerald-700" : "text-amber-800")}>
        {pack ? "✓ الحزمة صالحة: 5 ألعاب × 5 أسئلة" : "المحتوى يحتاج JSON صحيحًا بخمس ألعاب وخمسة أسئلة لكل لعبة."}
      </p>
    </section>
    {pack && <section className="rounded-3xl bg-white p-5">
      <h2 className="text-xl font-black">مراجعة الأسئلة والإجابات — 25 سؤالًا</h2>
      <div className="mt-4 space-y-5">
        {GAME_MODES.map(mode => <div key={mode} className="rounded-2xl border p-4">
          <h3 className="font-black">{labels[mode]}</h3>
          <ol className="mt-3 list-inside list-decimal space-y-3 text-sm">
            {pack[mode].map((item, i) => <li key={i} className="leading-7">
              {item.prompt}
              <p className="mr-4 font-bold text-emerald-700">الإجابة: {item.answer}</p>
            </li>)}
          </ol>
        </div>)}
      </div>
      <label className="mt-5 flex items-start gap-2 font-bold">
        <input type="checkbox" checked={aiAssisted} onChange={e => setAiAssisted(e.target.checked)}/>
        توليد الأسئلة بمساعدة ذكاء ضاديوم (لتوثيق المصدر)
      </label>
      <label className="mt-4 flex items-start gap-2 font-bold">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>
        راجعت بنفسي صحة كل سؤال وخياراته وإجابته ومناسبته لعمر الطالب ومحتوى الدرس.
      </label>
      <button type="button" disabled={!confirmed || busy} onClick={() => void publish()}
        className="mt-5 rounded-xl bg-[#123f39] px-6 py-4 font-black text-white disabled:opacity-50">
        اعتماد ونشر 25 سؤالًا
      </button>
    </section>}
    {message && <p role="status" className="rounded-xl bg-[#fff4dd] p-4 font-bold">{message}</p>}
  </div>;
}
