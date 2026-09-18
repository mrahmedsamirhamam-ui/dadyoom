"use client";

import { useId } from "react";
import { motion } from "motion/react";

type DadMarkProps = {
  state?: string;
  size?: number;
  className?: string;
};

export default function DadMark({
  state = "idle",
  size = 64,
  className = "",
}: DadMarkProps) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `dad-ai-gradient-${rawId}`;
  const shadowId = `dad-ai-shadow-${rawId}`;

  const isThinking = state === "thinking";
  const isTalking = state === "talking" || state === "reading";
  const isListening = state === "listening";
  const isSuccess = state === "correct" || state === "celebrating";
  const isError = state === "error";

  const accent = isError
    ? "#e76f51"
    : isSuccess
      ? "#2f9f72"
      : isListening
        ? "#38bdf8"
        : "#f5cf7a";

  const animation = isSuccess
    ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }
    : isError
      ? { x: [0, -2, 2, -2, 0] }
      : isTalking
        ? { y: [0, -2, 0] }
        : isThinking || isListening
          ? { scale: [1, 1.035, 1] }
          : { y: [0, -1.5, 0] };

  return (
    <motion.div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size }}
      animate={animation}
      transition={{
        duration: isSuccess ? 0.85 : isError ? 0.45 : 2.4,
        repeat:
          isThinking || isTalking || isListening || state === "idle"
            ? Infinity
            : 0,
        ease: "easeInOut",
      }}
      role="img"
      aria-label="ضاد، المساعد التعليمي الذكي في ضاديوم"
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="20"
            y1="14"
            x2="102"
            y2="106"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1f665c" />
            <stop offset="56%" stopColor="#123f39" />
            <stop offset="100%" stopColor="#082d29" />
          </linearGradient>

          <filter id={shadowId}>
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="5"
              floodColor="#062a27"
              floodOpacity="0.22"
            />
          </filter>
        </defs>

        <circle
          cx="60"
          cy="60"
          r="55"
          fill="#fffdf8"
          stroke="#d7c391"
          strokeWidth="2"
        />

        <circle
          cx="60"
          cy="60"
          r="48"
          fill={`url(#${gradientId})`}
          filter={`url(#${shadowId})`}
        />

        <circle
          cx="60"
          cy="60"
          r="43"
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          strokeDasharray={isThinking ? "4 5" : undefined}
        />

        <path
          d="M31 38h58c8 0 14 6 14 14v25c0 8-6 14-14 14H67L51 102l3-11H31c-8 0-14-6-14-14V52c0-8 6-14 14-14Z"
          fill="#fffdf8"
        />

        <text
          x="60"
          y="77"
          textAnchor="middle"
          fontSize="50"
          fontWeight="900"
          fill="#123f39"
          fontFamily="Cairo, Tajawal, Arial, sans-serif"
        >
          ض
        </text>

        <path d="M60 13l5 5-5 5-5-5 5-5Z" fill="#f5cf7a" />
        <circle cx="92" cy="31" r="4.2" fill={accent} />

        {isListening ? (
          <path
            d="M22 59c-5 5-5 13 0 18"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : null}

        {isTalking ? (
          <path
            d="M98 59c5 5 5 13 0 18"
            fill="none"
            stroke="#f5cf7a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : null}

        {isSuccess ? (
          <path
            d="M101 53l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8 2.4-4.8Z"
            fill="#f5cf7a"
          />
        ) : null}
      </svg>
    </motion.div>
  );
}
