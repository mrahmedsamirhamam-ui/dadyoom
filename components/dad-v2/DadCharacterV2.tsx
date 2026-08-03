"use client";

import { motion } from "motion/react";
import type { DadCharacterV2Props } from "./types";
import { useBlink } from "./hooks/useBlink";
import { useEyeTracking } from "./hooks/useEyeTracking";

export default function DadCharacterV2({
  state,
  size = 180,
  className = "",
}: DadCharacterV2Props) {
  const blink = useBlink();
  const eyes = useEyeTracking();

  const active = state === "thinking" || state === "talking" || state === "reading";
  const success = state === "correct" || state === "celebrating";
  const sad = state === "error";
  const encouraging = state === "encouraging";
  const listening = state === "listening";

  const bodyAnimation =
    state === "thinking"
      ? { y: [0, -5, 0], rotate: [-2, 2, -2] }
      : state === "talking" || state === "reading"
        ? { y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5] }
        : success
          ? { y: [0, -18, 0], rotate: [-6, 6, 0], scale: [1, 1.08, 1] }
          : encouraging
            ? { x: [0, -6, 6, -5, 5, 0] }
            : sad
              ? { x: [0, -5, 5, -5, 5, 0] }
              : { y: [0, -3, 0, 2, 0], rotate: [0, -1, 0, 1, 0] };

  const repeat =
    state === "idle" ||
    state === "thinking" ||
    state === "talking" ||
    state === "reading" ||
    state === "listening"
      ? Infinity
      : 0;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size * 1.32 }}
      aria-label="ضاد، رفيق التعلم"
      role="img"
    >
      <motion.div
        animate={bodyAnimation}
        transition={{
          duration: state === "idle" ? 3.2 : state === "celebrating" ? 1.2 : 0.65,
          repeat,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "50% 88%" }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 260 340" className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3bf8f" />
              <stop offset="100%" stopColor="#d78a5a" />
            </linearGradient>
            <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#dce7f5" />
            </linearGradient>
            <linearGradient id="pants" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334d75" />
              <stop offset="100%" stopColor="#1f2f4d" />
            </linearGradient>
            <filter id="softShadow">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.22" />
            </filter>
          </defs>

          <motion.ellipse
            cx="130"
            cy="325"
            rx="67"
            ry="12"
            fill="#0f172a"
            opacity="0.15"
            animate={{ scaleX: success ? [1, 0.62, 1] : [1, 0.95, 1] }}
            transition={{ duration: success ? 1.2 : 3.2, repeat }}
          />

          {/* Legs */}
          <motion.g
            animate={{ rotate: success ? [-4, 10, -4] : 0 }}
            style={{ transformOrigin: "105px 258px" }}
          >
            <path d="M92 233 L112 233 L114 299 L88 299 Z" fill="url(#pants)" />
            <path d="M83 295 Q104 289 121 300 Q116 316 88 314 Q78 309 83 295Z" fill="#5a3a23" />
          </motion.g>

          <motion.g
            animate={{ rotate: success ? [4, -10, 4] : 0 }}
            style={{ transformOrigin: "157px 258px" }}
          >
            <path d="M149 233 L169 233 L173 299 L147 299 Z" fill="url(#pants)" />
            <path d="M142 300 Q161 289 181 298 Q183 311 171 315 L145 314 Q137 308 142 300Z" fill="#5a3a23" />
          </motion.g>

          {/* Torso */}
          <path
            d="M76 165 Q130 145 184 165 L191 239 Q130 256 69 239 Z"
            fill="url(#shirt)"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <path d="M119 162 L130 178 L141 162 L151 235 L109 235 Z" fill="#f8fafc" opacity="0.65" />
          <path d="M124 171 L136 171 L140 215 L130 226 L120 215 Z" fill="#ef4444" />
          <path d="M118 178 L142 178" stroke="#b91c1c" strokeWidth="3" />

          {/* Belt */}
          <rect x="72" y="231" width="116" height="17" rx="6" fill="#5b3b24" />
          <rect x="120" y="229" width="21" height="20" rx="4" fill="#f2c94c" stroke="#a76c00" strokeWidth="2" />

          {/* Badge */}
          <path d="M145 195 L176 195 L174 235 L160 226 L147 235 Z" fill="#facc15" stroke="#b7791f" strokeWidth="2" />
          <text x="160" y="219" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0f766e">ض</text>

          {/* Arms */}
          <motion.g
            animate={{
              rotate:
                state === "talking"
                  ? [-8, 10, -8]
                  : encouraging
                    ? [-12, 18, -12]
                    : success
                      ? [-10, 30, -10]
                      : -4,
            }}
            transition={{ duration: 0.55, repeat: active || encouraging || success ? Infinity : 0 }}
            style={{ transformOrigin: "76px 176px" }}
          >
            <path d="M79 171 Q55 181 45 211" fill="none" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
            <ellipse cx="42" cy="218" rx="17" ry="19" fill="url(#skin)" />
          </motion.g>

          <motion.g
            animate={{
              rotate:
                state === "talking"
                  ? [10, -8, 10]
                  : state === "thinking"
                    ? [4, -25, 4]
                    : listening
                      ? [5, -14, 5]
                      : success
                        ? [10, -28, 10]
                        : 6,
            }}
            transition={{ duration: 0.55, repeat: active || listening || success ? Infinity : 0 }}
            style={{ transformOrigin: "183px 176px" }}
          >
            <path d="M181 171 Q207 180 214 207" fill="none" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
            <ellipse cx="217" cy="215" rx="17" ry="19" fill="url(#skin)" />
          </motion.g>

          {/* Neck */}
          <rect x="117" y="145" width="27" height="27" rx="10" fill="url(#skin)" />

          {/* Head */}
          <motion.g
            animate={{
              rotate: state === "thinking" ? -6 : state === "talking" ? [0, 2, -2, 0] : 0,
              y: state === "thinking" ? -2 : 0,
            }}
            transition={{ duration: 0.6, repeat: state === "talking" ? Infinity : 0 }}
            style={{ transformOrigin: "130px 105px" }}
          >
            <ellipse cx="130" cy="101" rx="69" ry="72" fill="url(#skin)" filter="url(#softShadow)" />

            {/* Ears */}
            <ellipse cx="61" cy="105" rx="13" ry="19" fill="url(#skin)" />
            <ellipse cx="199" cy="105" rx="13" ry="19" fill="url(#skin)" />

            {/* Hair */}
            <path
              d="M67 78 Q70 25 126 19 Q178 14 197 60 Q179 47 159 49 Q154 34 134 45 Q114 30 96 47 Q81 46 67 78Z"
              fill="#26303a"
            />
            <path d="M97 33 Q126 14 162 28" fill="none" stroke="#4b5563" strokeWidth="6" strokeLinecap="round" />

            {/* Brows */}
            <motion.path
              d="M83 79 Q101 69 117 78"
              fill="none"
              stroke="#3f2c22"
              strokeWidth="6"
              strokeLinecap="round"
              animate={{ y: state === "thinking" ? -5 : success ? -3 : 0, rotate: state === "thinking" ? -7 : 0 }}
            />
            <motion.path
              d="M143 78 Q160 69 178 79"
              fill="none"
              stroke="#3f2c22"
              strokeWidth="6"
              strokeLinecap="round"
              animate={{ y: state === "thinking" ? -5 : success ? -3 : 0, rotate: state === "thinking" ? 7 : 0 }}
            />

            {/* Glasses */}
            <rect x="75" y="82" width="49" height="35" rx="12" fill="#dbeafe" fillOpacity="0.45" stroke="#1f2937" strokeWidth="5" />
            <rect x="136" y="82" width="49" height="35" rx="12" fill="#dbeafe" fillOpacity="0.45" stroke="#1f2937" strokeWidth="5" />
            <path d="M124 98 Q130 94 136 98" fill="none" stroke="#1f2937" strokeWidth="5" />

            {/* Eyes */}
            <motion.g
              animate={{ scaleY: blink ? 0.08 : 1 }}
              transition={{ duration: 0.07 }}
              style={{ transformOrigin: "99px 99px" }}
            >
              <ellipse cx="99" cy="99" rx="12" ry="10" fill="#ffffff" />
              <motion.circle cx="99" cy="99" r="5" fill="#6b3f24" animate={{ x: eyes.x, y: eyes.y }} />
              <circle cx="101" cy="97" r="1.5" fill="#ffffff" />
            </motion.g>
            <motion.g
              animate={{ scaleY: blink || state === "correct" ? 0.08 : 1 }}
              transition={{ duration: 0.07 }}
              style={{ transformOrigin: "160px 99px" }}
            >
              <ellipse cx="160" cy="99" rx="12" ry="10" fill="#ffffff" />
              <motion.circle cx="160" cy="99" r="5" fill="#6b3f24" animate={{ x: eyes.x, y: eyes.y }} />
              <circle cx="162" cy="97" r="1.5" fill="#ffffff" />
            </motion.g>

            {/* Nose */}
            <path d="M129 103 Q123 119 131 121" fill="none" stroke="#bb6b46" strokeWidth="3" strokeLinecap="round" />

            {/* Mustache */}
            <path d="M103 129 Q117 120 130 130 Q143 120 158 129 Q145 142 130 135 Q116 142 103 129Z" fill="#2f251f" />

            {/* Mouth */}
            {state === "talking" || state === "reading" ? (
              <motion.g
                animate={{ scaleY: [0.45, 1.25, 0.7, 1.05, 0.45], scaleX: [1, 0.85, 1.12, 0.9, 1] }}
                transition={{ duration: 0.22, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "130px 146px" }}
              >
                <ellipse cx="130" cy="146" rx="19" ry="13" fill="#321d1d" />
                <ellipse cx="130" cy="151" rx="10" ry="4" fill="#ef767a" />
              </motion.g>
            ) : sad ? (
              <path d="M111 151 Q130 138 149 151" fill="none" stroke="#321d1d" strokeWidth="5" strokeLinecap="round" />
            ) : (
              <path d="M106 141 Q130 162 154 141 Q147 161 130 165 Q113 161 106 141Z" fill="#ffffff" stroke="#321d1d" strokeWidth="3" />
            )}

            {/* Cheeks */}
            <ellipse cx="82" cy="130" rx="11" ry="5" fill="#ef9a8d" opacity="0.55" />
            <ellipse cx="178" cy="130" rx="11" ry="5" fill="#ef9a8d" opacity="0.55" />
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
                x: index % 2 === 0 ? 58 : -58,
                y: -38 - index * 14,
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
