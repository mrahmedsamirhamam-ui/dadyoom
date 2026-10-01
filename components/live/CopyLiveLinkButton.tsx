"use client";

import { useState } from "react";

export default function CopyLiveLinkButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/live/${sessionId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("انسخ رابط الغرفة:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-2xl border border-[#d8c89f] bg-white px-4 py-2 text-center text-sm font-black text-[#123f39]"
    >
      {copied ? "تم نسخ الرابط ✓" : "نسخ رابط الغرفة"}
    </button>
  );
}
