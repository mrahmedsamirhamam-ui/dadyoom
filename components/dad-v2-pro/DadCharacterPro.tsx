"use client";

import { motion } from "motion/react";
import type { DadCharacterProProps } from "./types";
import { useBlink } from "./hooks/useBlink";
import { useEyeTracking } from "./hooks/useEyeTracking";

export default function DadCharacterPro({
  state,
  size = 240,
  className = "",
}: DadCharacterProProps) {
  const blink = useBlink();
  const eyes = useEyeTracking();

  const talking = state === "talking" || state === "reading";
  const thinking = state === "thinking";
  const success = state === "correct" || state === "celebrating";
  const encouraging = state === "encouraging";
  const listening = state === "listening";
  const error = state === "error";

  const repeat = ["idle", "talking", "reading", "thinking", "listening"].includes(state)
    ? Infinity
    : 0;

  const bodyMotion =
    thinking
      ? { y: [0, -5, 0], rotate: [-2.5, 2.5, -2.5] }
      : talking
        ? { y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5] }
        : success
          ? { y: [0, -20, 0], rotate: [-6, 6, 0], scale: [1, 1.08, 1] }
          : encouraging
            ? { x: [0, -7, 7, -5, 5, 0] }
            : error
              ? { x: [0, -5, 5, -5, 5, 0] }
              : { y: [0, -3, 0, 2, 0], rotate: [0, -1, 0, 1, 0] };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size * 1.42 }}
      role="img"
      aria-label="ضاد، رفيق التعلم"
    >
      <motion.div
        animate={bodyMotion}
        transition={{
          duration: state === "idle" ? 3.2 : success ? 1.25 : 0.62,
          repeat,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "50% 90%" }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 300 430" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="skinPro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f6c69c" />
              <stop offset="100%" stopColor="#d88c5f" />
            </linearGradient>
            <linearGradient id="shirtPro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#dfeaf6" />
            </linearGradient>
            <linearGradient id="pantsPro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#31598f" />
              <stop offset="100%" stopColor="#1d3557" />
            </linearGradient>
            <linearGradient id="shoePro" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7a4b2d" />
              <stop offset="100%" stopColor="#3d2417" />
            </linearGradient>
            <filter id="shadowPro">
              <feDropShadow dx="0" dy="10" stdDeviation="7" floodOpacity="0.2" />
            </filter>
          </defs>

          <motion.ellipse
            cx="150"
            cy="414"
            rx="82"
            ry="13"
            fill="#0f172a"
            opacity="0.16"
            animate={{ scaleX: success ? [1, 0.62, 1] : [1, 0.95, 1] }}
            transition={{ duration: success ? 1.2 : 3.2, repeat }}
          />

          {/* Legs */}
          <motion.g animate={{ rotate: success ? [-3, 9, -3] : 0 }} style={{ transformOrigin: "118px 330px" }}>
            <path d="M101 292 L127 292 L129 382 L97 382 Z" fill="url(#pantsPro)" />
            <path d="M89 377 Q113 369 139 382 Q137 401 102 402 Q84 397 89 377Z" fill="url(#shoePro)" />
          </motion.g>

          <motion.g animate={{ rotate: success ? [3, -9, 3] : 0 }} style={{ transformOrigin: "184px 330px" }}>
            <path d="M173 292 L199 292 L205 382 L173 382 Z" fill="url(#pantsPro)" />
            <path d="M165 382 Q190 369 217 379 Q219 396 207 402 L175 402 Q158 397 165 382Z" fill="url(#shoePro)" />
          </motion.g>

          {/* Torso */}
          <path
            d="M84 196 Q150 170 216 196 L225 302 Q150 325 75 302 Z"
            fill="url(#shirtPro)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <path d="M137 190 L150 209 L163 190 L175 298 L125 298 Z" fill="#f8fafc" opacity="0.7" />
          <path d="M143 201 L157 201 L163 257 L150 270 L137 257 Z" fill="#1d4ed8" />
          <path d="M140 210 L160 210" stroke="#1e3a8a" strokeWidth="3" />

          {/* Belt */}
          <rect x="78" y="294" width="144" height="20" rx="7" fill="#5b3821" />
          <rect x="138" y="292" width="25" height="24" rx="5" fill="#f5c542" stroke="#a76c00" strokeWidth="2" />

          {/* Badge */}
          <circle cx="188" cy="239" r="21" fill="#facc15" stroke="#b7791f" strokeWidth="3" />
          <path d="M176 254 L181 276 L188 268 L195 276 L200 254" fill="#ef4444" />
          <text x="188" y="247" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f766e">ض</text>

          {/* Arms */}
          <motion.g
            animate={{
              rotate: talking ? [-8, 12, -8] : encouraging ? [-12, 18, -12] : success ? [-10, 35, -10] : -4,
            }}
            transition={{ duration: 0.55, repeat: talking || encouraging || success ? Infinity : 0 }}
            style={{ transformOrigin: "87px 205px" }}
          >
            <path d="M88 205 Q54 217 42 258" fill="none" stroke="#ffffff" strokeWidth="26" strokeLinecap="round" />
            <ellipse cx="39" cy="270" rx="20" ry="23" fill="url(#skinPro)" />
          </motion.g>

          <motion.g
            animate={{
              rotate: talking ? [10, -10, 10] : thinking ? [4, -28, 4] : listening ? [4, -17, 4] : success ? [10, -32, 10] : 5,
            }}
            transition={{ duration: 0.55, repeat: talking || thinking || listening || success ? Infinity : 0 }}
            style={{ transformOrigin: "214px 205px" }}
          >
            <path d="M213 205 Q248 218 258 257" fill="none" stroke="#ffffff" strokeWidth="26" strokeLinecap="round" />
            <ellipse cx="261" cy="270" rx="20" ry="23" fill="url(#skinPro)" />
          </motion.g>

          {/* Neck */}
          <rect x="135" y="168" width="31" height="32" rx="11" fill="url(#skinPro)" />

          {/* Head */}
          <motion.g
            animate={{
              rotate: thinking ? -6 : talking ? [0, 2, -2, 0] : 0,
              y: thinking ? -2 : 0,
            }}
            transition={{ duration: 0.6, repeat: talking ? Infinity : 0 }}
            style={{ transformOrigin: "150px 112px" }}
          >
            <ellipse cx="150" cy="113" rx="82" ry="88" fill="url(#skinPro)" filter="url(#shadowPro)" />
            <ellipse cx="68" cy="117" rx="14" ry="22" fill="url(#skinPro)" />
            <ellipse cx="232" cy="117" rx="14" ry="22" fill="url(#skinPro)" />

            {/* Hair */}
            <path
              d="M71 83 Q75 24 142 16 Q205 8 229 65 Q207 49 183 53 Q174 35 151 48 Q126 30 104 50 Q86 48 71 83Z"
              fill="#2c3138"
            />
            <path d="M105 34 Q143 10 187 28" fill="none" stroke="#525b66" strokeWidth="7" strokeLinecap="round" />

            {/* Brows */}
            <motion.path
              d="M93 88 Q113 77 132 87"
              fill="none"
              stroke="#4a3022"
              strokeWidth="7"
              strokeLinecap="round"
              animate={{ y: thinking ? -5 : success ? -3 : 0, rotate: thinking ? -7 : 0 }}
            />
            <motion.path
              d="M169 87 Q188 77 208 88"
              fill="none"
              stroke="#4a3022"
              strokeWidth="7"
              strokeLinecap="round"
              animate={{ y: thinking ? -5 : success ? -3 : 0, rotate: thinking ? 7 : 0 }}
            />

            {/* Glasses */}
            <rect x="84" y="94" width="59" height="42" rx="14" fill="#dbeafe" fillOpacity="0.4" stroke="#1f2937" strokeWidth="6" />
            <rect x="157" y="94" width="59" height="42" rx="14" fill="#dbeafe" fillOpacity="0.4" stroke="#1f2937" strokeWidth="6" />
            <path d="M143 112 Q150 107 157 112" fill="none" stroke="#1f2937" strokeWidth="6" />

            {/* Eyes */}
            <motion.g animate={{ scaleY: blink ? 0.08 : 1 }} transition={{ duration: 0.07 }} style={{ transformOrigin: "113px 115px" }}>
              <ellipse cx="113" cy="115" rx="15" ry="13" fill="#ffffff" />
              <motion.circle cx="113" cy="115" r="6" fill="#6b3f24" animate={{ x: eyes.x, y: eyes.y }} />
              <circle cx="115" cy="112" r="1.8" fill="#ffffff" />
            </motion.g>
            <motion.g animate={{ scaleY: blink || state === "correct" ? 0.08 : 1 }} transition={{ duration: 0.07 }} style={{ transformOrigin: "187px 115px" }}>
              <ellipse cx="187" cy="115" rx="15" ry="13" fill="#ffffff" />
              <motion.circle cx="187" cy="115" r="6" fill="#6b3f24" animate={{ x: eyes.x, y: eyes.y }} />
              <circle cx="189" cy="112" r="1.8" fill="#ffffff" />
            </motion.g>

            {/* Nose */}
            <path d="M149 119 Q142 138 151 140" fill="none" stroke="#b96d49" strokeWidth="3.5" strokeLinecap="round" />

            {/* Mustache */}
            <path d="M116 148 Q132 136 150 149 Q168 136 185 148 Q169 164 150 156 Q132 164 116 148Z" fill="#35251e" />

            {/* Mouth */}
            {talking ? (
              <motion.g
                animate={{ scaleY: [0.42, 1.3, 0.7, 1.05, 0.42], scaleX: [1, 0.84, 1.12, 0.9, 1] }}
                transition={{ duration: 0.22, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "150px 169px" }}
              >
                <ellipse cx="150" cy="169" rx="22" ry="15" fill="#321d1d" />
                <ellipse cx="150" cy="175" rx="12" ry="4.5" fill="#ef767a" />
              </motion.g>
            ) : error ? (
              <path d="M126 174 Q150 158 174 174" fill="none" stroke="#321d1d" strokeWidth="5.5" strokeLinecap="round" />
            ) : (
              <path d="M121 162 Q150 187 179 162 Q172 186 150 191 Q128 186 121 162Z" fill="#ffffff" stroke="#321d1d" strokeWidth="3.5" />
            )}

            <ellipse cx="92" cy="150" rx="12" ry="5.5" fill="#ef9a8d" opacity="0.55" />
            <ellipse cx="208" cy="150" rx="12" ry="5.5" fill="#ef9a8d" opacity="0.55" />
          </motion.g>
        </svg>
      </motion.div>

      {state === "celebrating" ? (
        <div className="pointer-events-none absolute inset-0">
          {["✨", "⭐", "🎉", "🏆"].map((symbol, index) => (
            <motion.span
              key={`${symbol}-${index}`}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.3, 1.25, 0.8],
                x: index % 2 === 0 ? 64 : -64,
                y: -42 - index * 15,
                rotate: [0, 10, -8, 0],
              }}
              transition={{ duration: 1.3, delay: index * 0.1 }}
              className="absolute left-1/2 top-1/2 text-2xl"
            >
              {symbol}
            </motion.span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
