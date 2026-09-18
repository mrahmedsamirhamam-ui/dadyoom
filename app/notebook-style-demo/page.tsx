"use client";

import { useState } from "react";

const slides = Array.from(
  { length: 11 },
  (_, index) =>
    `/lesson-packs/notebook-style/nakira-marifa/slides/${String(index + 1).padStart(2, "0")}.png`
);

export default function NotebookStyleDemoPage() {
  const [current, setCurrent] = useState(0);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f4f1e8] px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 rounded-[1.75rem] border border-[#dec99a] bg-[#fffdf8] px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-[#a37725]">نموذج ضاديوم — Notebook Style</p>
            <h1 className="mt-1 text-2xl font-black text-[#123f39] sm:text-3xl">النكرة والمعرفة</h1>
            <p className="mt-1 text-sm font-bold text-[#756b5c]">عرض بصري كامل بصورة واحدة لكل شريحة.</p>
          </div>
          <div className="rounded-full bg-[#123f39] px-4 py-2 text-sm font-black text-white">{current + 1} / {slides.length}</div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-[#d8c18c] bg-[#0b2f2b] shadow-2xl shadow-[#123f39]/15">
          <div className="h-1.5 bg-[#173f38]">
            <div className="h-full bg-[#e1b852] transition-all duration-300" style={{ width: `${((current + 1) / slides.length) * 100}%` }} />
          </div>

          <div className="relative flex min-h-[55vh] items-center justify-center bg-[#efe8d9] p-2 sm:p-4 lg:min-h-[72vh]">
            <img src={slides[current]} alt={`شريحة ${current + 1}`} className="block h-auto max-h-[78vh] w-full rounded-xl object-contain shadow-lg" draggable={false} />
            <button type="button" onClick={() => setCurrent((v) => Math.max(0, v - 1))} disabled={current === 0} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#123f39]/95 text-3xl font-black text-white shadow-lg disabled:opacity-20 sm:right-6">›</button>
            <button type="button" onClick={() => setCurrent((v) => Math.min(slides.length - 1, v + 1))} disabled={current === slides.length - 1} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-[#123f39]/95 text-3xl font-black text-white shadow-lg disabled:opacity-20 sm:left-6">‹</button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#123f39] px-4 py-4">
            {slides.map((_, index) => (
              <button key={index} type="button" onClick={() => setCurrent(index)} className={index === current ? "h-2.5 w-8 rounded-full bg-[#e1b852]" : "h-2.5 w-2.5 rounded-full bg-white/35 hover:bg-white/60"} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
