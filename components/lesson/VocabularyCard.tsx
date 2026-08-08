"use client";

import { useState } from "react";

type VocabularyCardProps = {
  word: string;
  meaning: string;
};

export default function VocabularyCard({
  word,
  meaning,
}: VocabularyCardProps) {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setShowMeaning(!showMeaning)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:border-emerald-500 hover:shadow-md"
    >
      <h3 className="text-xl font-bold text-emerald-700">
        {word}
      </h3>

      <div className="mt-3 min-h-[48px]">
        {showMeaning ? (
          <p className="leading-7 text-slate-700">
            {meaning}
          </p>
        ) : (
          <p className="text-slate-400">
            اضغط لإظهار المعنى
          </p>
        )}
      </div>
    </button>
  );
}