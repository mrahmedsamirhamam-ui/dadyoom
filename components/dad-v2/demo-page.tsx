"use client";

import { useState } from "react";
import type { DadState } from "@/services/dad-ai";
import DadCharacterV2 from "./DadCharacterV2";

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

export default function DadCharacterDemoPage() {
  const [state, setState] = useState<DadState>("idle");

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <DadCharacterV2 state={state} size={220} />
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
