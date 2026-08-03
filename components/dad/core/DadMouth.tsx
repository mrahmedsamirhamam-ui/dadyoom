"use client";

import { motion } from "motion/react";
import type { MouthShape } from "../animations/useLipSync";

type Props = { shape: MouthShape };

export default function DadMouth({ shape }: Props) {
  if (shape === "idle") {
    return <path d="M220 307 Q256 329 292 307" fill="none" stroke="#26323F" strokeWidth="7" strokeLinecap="round" />;
  }

  const rx =
    shape === "o" ? 15 :
    shape === "e" ? 31 :
    shape === "m" ? 28 :
    shape === "u" ? 18 : 24;

  const ry =
    shape === "a" ? 24 :
    shape === "o" ? 20 :
    shape === "e" ? 9 :
    shape === "m" ? 5 :
    shape === "u" ? 13 : 16;

  return (
    <motion.g
      key={shape}
      initial={{ scaleY: 0.7, opacity: 0.8 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.07 }}
      style={{ transformOrigin: "256px 310px" }}
    >
      <ellipse cx="256" cy="310" rx={rx} ry={ry} fill="#2F1717" />
      {shape !== "m" && <ellipse cx="256" cy="318" rx={Math.max(7, rx * 0.5)} ry={Math.max(3, ry * 0.28)} fill="#F08A96" />}
    </motion.g>
  );
}
