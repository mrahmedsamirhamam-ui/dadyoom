"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Item = {
  id: string;
  title: string;
  example: string;
  explanation: string;
  question: string;
  answer: string;
};

function fold(value: string) {
  return value.normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/[أإآ]/gu, "ا").replace(/ى/gu, "ي")
    .toLowerCase().trim();
}

export default function StudyPracticeCatalog({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState<Record<string, boolean>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const visible = useMemo(() => {
    const term = fold(query);
    if (!term) return items;
    return items.filter(item => fold(item.title + " " + item.example + " " + item.question).includes(term));
  }, [items, query]);

  const attempts = items.filter(item => attempted[item.id]).length;
  function compare(id: string) {
    if (!(drafts[id] ?? "").trim()) return;
    setAttempted(prev => ({ ...prev, [id]: true }));
    setReveal(prev => ({ ...prev, [id]: true }));
  }

  return <section aria-label="دروس المهارات التفاعلية" className="space-y-5">
    <div className="rounded-3xl border border-[#d9c9ac] bg-white p-5">
      <label htmlFor="study-skill-filter" className="text-lg font-black">🔍 ابحث داخل مهارات صفك</label>
      <input id="study-skill-filter" type="search" value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="مثال: الفاعل، الفهم، الهمزة…"
        className="mt-3 w-full rounded-2xl border border-[#cbb896] px-4 py-3" />
      <p role="status" className="mt-3 text-sm font-bold text-[#6e5b42]">
        {visible.length} من {items.length} مهارة ظاهرة • جربت {attempts} من {items.length} في هذا العرض
      </p>
      <p className="mt-1 text-xs leading-6 text-[#6c6252]">
        هذه محاولات تدريب ذاتي فقط؛ لا تُسجل درجات رسمية ولا تُرسل إجابتك إلى الخادم.
        يمكنك مقارنة إجابتك بالمفتاح بعد المحاولة أو الاطلاع عليه للمساعدة.
      </p>
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      {visible.map((item, index) =>
        <article key={item.id} className="rounded-3xl border border-[#ddcfb4] bg-white p-5">
          <p className="text-xs font-black text-[#926c26]">المهارة {index + 1}</p>
          <h2 className="mt-1 text-xl font-black">{item.title}</h2>
          <h3 className="mt-4 font-black">مثال محلول</h3>
          <p className="mt-2 whitespace-pre-wrap leading-8">{item.example || "افتح الدرس للاطلاع على المثال الكامل."}</p>
          {item.explanation ? <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#f6f0e4] p-3 leading-8">{item.explanation}</p> : null}
          <h3 className="mt-4 font-black">أطبق بنفسي</h3>
          <p className="mt-2 whitespace-pre-wrap leading-8">{item.question || "تدرّب على المهارة بالاعتماد على المثال."}</p>
          <label htmlFor={"answer-" + item.id} className="mt-4 block font-black">محاولتك أنت</label>
          <textarea id={"answer-" + item.id} rows={3} maxLength={1500}
            value={drafts[item.id] ?? ""}
            onChange={event => {
              const next = event.target.value;
              setDrafts(prev => ({ ...prev, [item.id]: next }));
              if (attempted[item.id]) setAttempted(prev => ({ ...prev, [item.id]: false }));
            }}
            className="mt-2 w-full rounded-xl border border-[#cbb896] p-3"
            placeholder="اكتب إجابتك ثم قارنها بمفتاح المراجعة…" />
          <button type="button" onClick={() => compare(item.id)}
            disabled={!(drafts[item.id] ?? "").trim()}
            className="mt-3 rounded-full bg-[#123f39] px-5 py-3 font-black text-white disabled:opacity-40">
            قارِن إجابتي بالمفتاح
          </button>
          {attempted[item.id] ? <p className="mt-2 text-sm font-bold text-[#17604d]">
            أتممت محاولة تدريب. راجع إجابتك بنفسك؛ لم تُحتسب درجة آلية.
          </p> : null}
          {item.answer ? <details className="mt-4 rounded-xl border border-[#d8c7a4] bg-[#fff9ea] p-4"
              open={reveal[item.id] === true}
              onToggle={event => {
                if (!event.currentTarget.open && reveal[item.id]) {
                  setReveal(prev => ({ ...prev, [item.id]: false }));
                }
              }}>
              <summary className="cursor-pointer font-black">أظهر الإجابة بعد المحاولة أو للمساعدة</summary>
              <p className="mt-2 whitespace-pre-wrap leading-8">{item.answer}</p>
            </details> : null}
          <Link href={"/lessons/" + item.id} prefetch={false}
            className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#123f39] px-4 py-2 font-black text-white">
            افتح الدرس وأنشطته ←
          </Link>
        </article>)}
      {!visible.length ? <p className="rounded-2xl bg-white p-6 text-[#635c52]">
        لم نجد مهارة تطابق البحث في هذا الصف. جرّب كلمة أقصر أو امسح البحث.
      </p> : null}
    </div>
  </section>;
}
