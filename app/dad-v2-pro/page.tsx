"use client";

import { useState } from "react";
import type { DadState } from "@/services/dad-ai";
import { DadCharacterPro } from "@/components/dad-v2-pro";

const states: DadState[] = [
  "idle",
  "listening",
  "thinking",
  "talking",
  "reading",
  "correct",
  "encouraging",
  "celebrating",
  "error",
];

export default function Page() {
  const [state, setState] = useState<DadState>("idle");

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <DadCharacterPro state={state} size={260} />
        <div className="flex flex-wrap justify-center gap-2">
          {states.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setState(item)}
              className="rounded-xl bg-teal-600 px-4 py-2 font-bold text-white"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
