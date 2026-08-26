
"use client";

import { useId } from "react";
import { motion } from "motion/react";

type Props = {
  state?: string;
  size?: number;
  className?: string;
};

export default function DadRobot({
  state = "idle",
  size = 150,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const gold = `dad-gold-${uid}`;
  const face = `dad-face-${uid}`;
  const body = `dad-body-${uid}`;

  const thinking = state === "thinking";
  const talking = state === "talking" || state === "reading";
  const listening = state === "listening";
  const celebrating = state === "correct" || state === "celebrating";
  const error = state === "error";

  const bodyMotion = celebrating
    ? { y: [0, -10, 0], rotate: [0, -4, 4, 0], scale: [1, 1.07, 1] }
    : thinking
      ? { y: [0, -3, 0], rotate: [-2, 2, -2] }
      : talking
        ? { y: [0, -3, 0], rotate: [-1, 1, -1] }
        : error
          ? { x: [0, -4, 4, -4, 4, 0] }
          : { y: [0, -2, 0, 1, 0] };

  return (
    <motion.div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size * 1.18 }}
      animate={bodyMotion}
      transition={{
        duration: celebrating ? 1.1 : 2.8,
        repeat: celebrating || error ? 0 : Infinity,
        ease: "easeInOut",
      }}
      role="img"
      aria-label="ضاد، الرفيق الذكي لتعلّم العربية"
    >
      <svg viewBox="0 0 240 285" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={body} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fffdf7" />
            <stop offset="100%" stopColor="#d9e7e2" />
          </linearGradient>
          <linearGradient id={face} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#123f39" />
            <stop offset="100%" stopColor="#071f2b" />
          </linearGradient>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe3a1" />
            <stop offset="100%" stopColor="#c48626" />
          </linearGradient>
          <filter id={`shadow-${uid}`}>
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodOpacity="0.18" />
          </filter>
        </defs>

        <ellipse cx="120" cy="266" rx="68" ry="12" fill="#123f39" opacity="0.12" />

        <g filter={`url(#shadow-${uid})`}>
          <path d="M68 103h104v111c0 23-19 42-42 42h-20c-23 0-42-19-42-42V103Z" fill={`url(#${body})`} stroke="#abc9c0" strokeWidth="3" />
          <path d="M87 206c22 10 44 10 66 0" fill="none" stroke="#b78b3b" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
          <circle cx="120" cy="168" r="29" fill={`url(#${gold})`} stroke="#fff8e8" strokeWidth="4" />
          <text x="120" y="180" textAnchor="middle" fontSize="37" fontWeight="900" fill="#123f39" fontFamily="serif">ض</text>

          <rect x="48" y="34" width="144" height="105" rx="42" fill={`url(#${body})`} stroke="#abc9c0" strokeWidth="3" />
          <rect x="61" y="48" width="118" height="76" rx="31" fill={`url(#${face})`} />

          <path d="M120 34V18" stroke="#174f47" strokeWidth="5" strokeLinecap="round" />
          <circle cx="120" cy="13" r="7" fill={`url(#${gold})`} />

          <path d="M48 66H36c-8 0-14 6-14 14v13c0 8 6 14 14 14h12" fill="#dcebe6" stroke="#94b8ae" strokeWidth="3" />
          <path d="M192 66h12c8 0 14 6 14 14v13c0 8-6 14-14 14h-12" fill="#dcebe6" stroke="#94b8ae" strokeWidth="3" />
          <circle cx="30" cy="86" r="5" fill="#d6ad57" />
          <circle cx="210" cy="86" r="5" fill="#d6ad57" />

          <motion.ellipse
            cx="94"
            cy="82"
            rx="10"
            ry={listening ? 7 : 10}
            fill="#77f3dc"
            animate={{ opacity: thinking ? [0.45, 1, 0.45] : 1 }}
            transition={{ duration: 1.1, repeat: thinking ? Infinity : 0 }}
          />
          <motion.ellipse
            cx="146"
            cy="82"
            rx="10"
            ry={listening ? 7 : 10}
            fill="#77f3dc"
            animate={{ opacity: thinking ? [1, 0.45, 1] : 1 }}
            transition={{ duration: 1.1, repeat: thinking ? Infinity : 0 }}
          />

          <motion.path
            d={talking ? "M96 101 Q120 117 144 101" : "M101 101 Q120 112 139 101"}
            fill="none"
            stroke="#f6d67c"
            strokeWidth="5"
            strokeLinecap="round"
            animate={talking ? { d: ["M99 101 Q120 113 141 101", "M96 99 Q120 121 144 99", "M99 101 Q120 113 141 101"] } : undefined}
            transition={{ duration: 0.7, repeat: talking ? Infinity : 0 }}
          />

          <path d="M67 137 42 166c-8 9-8 23 1 31l9 8c8 7 20 6 27-2l12-15" fill={`url(#${body})`} stroke="#abc9c0" strokeWidth="3" />
          <path d="m173 137 25 29c8 9 8 23-1 31l-9 8c-8 7-20 6-27-2l-12-15" fill={`url(#${body})`} stroke="#abc9c0" strokeWidth="3" />

          <path d="M87 248v22" stroke="#174f47" strokeWidth="10" strokeLinecap="round" />
          <path d="M153 248v22" stroke="#174f47" strokeWidth="10" strokeLinecap="round" />
          <path d="M69 273h37" stroke="#c88f35" strokeWidth="9" strokeLinecap="round" />
          <path d="M134 273h37" stroke="#c88f35" strokeWidth="9" strokeLinecap="round" />
        </g>

        {celebrating ? (
          <g fill="#d6ad57">
            <circle cx="38" cy="37" r="5" />
            <circle cx="205" cy="29" r="4" />
            <path d="m26 130 5 9 10 2-7 7 2 10-10-5-9 5 2-10-7-7 10-2 4-9Z" />
            <path d="m207 135 4 7 8 1-6 6 2 8-8-4-7 4 1-8-5-6 8-1 3-7Z" />
          </g>
        ) : null}
      </svg>
    </motion.div>
  );
}
