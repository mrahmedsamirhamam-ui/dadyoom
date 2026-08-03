"use client";

import { motion } from "motion/react";
import type { DadState } from "@/services/dad-ai";
import { useLipSync } from "../animations/useLipSync";
import DadEyes from "./DadEyes";
import DadMouth from "./DadMouth";

type Props = {
  state: DadState;
  size?: number;
};

export default function DadFoundation({ state, size = 145 }: Props) {
  const mouth = useLipSync(state === "talking" || state === "reading");

  return (
    <svg
      viewBox="0 0 512 640"
      width={size}
      height={size * 1.25}
      role="img"
      aria-label="ضاد، رفيق تعلم العربية"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="dadCover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#13C7C1" />
          <stop offset="55%" stopColor="#00B4B0" />
          <stop offset="100%" stopColor="#008C87" />
        </linearGradient>
        <linearGradient id="dadPages" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F8F3DA" />
          <stop offset="100%" stopColor="#D9CFAD" />
        </linearGradient>
      </defs>

      <ellipse cx="256" cy="582" rx="150" ry="26" fill="#0F172A" opacity=".16" />

      <path d="M424 92 C449 100 462 119 462 149 L462 494 C462 520 449 536 426 542 L426 90Z"
            fill="url(#dadPages)" stroke="#B8AB7A" strokeWidth="5" />

      <rect x="86" y="64" width="340" height="470" rx="42"
            fill="url(#dadCover)" stroke="#006C68" strokeWidth="10" />
      <rect x="108" y="86" width="296" height="426" rx="30"
            fill="none" stroke="#F2C94C" strokeWidth="8" />
      <rect x="124" y="102" width="264" height="394" rx="24"
            fill="none" stroke="#FFF4B5" strokeWidth="3" opacity=".72" />

      <motion.path
        d="M359 66 L409 66 L409 174 L384 153 L359 174Z"
        fill="#F2C94C"
        stroke="#B98200"
        strokeWidth="5"
        animate={{ rotate: [-2, 3, -2], y: [0, -2, 0] }}
        transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "384px 66px" }}
      />

      <DadEyes />

      <path d="M164 198 Q205 174 246 198" fill="none" stroke="#21423F" strokeWidth="12" strokeLinecap="round" />
      <path d="M266 198 Q307 174 348 198" fill="none" stroke="#21423F" strokeWidth="12" strokeLinecap="round" />

      <ellipse cx="155" cy="300" rx="24" ry="10" fill="#FF9B9B" opacity=".42" />
      <ellipse cx="357" cy="300" rx="24" ry="10" fill="#FF9B9B" opacity=".42" />

      <DadMouth shape={mouth} />

      <circle cx="256" cy="410" r="58" fill="#F2C94C" stroke="#B98200" strokeWidth="8" />
      <text x="256" y="437" textAnchor="middle" fontSize="78" fontFamily="Arial, sans-serif" fontWeight="900" fill="#008C87">ض</text>
    </svg>
  );
}
