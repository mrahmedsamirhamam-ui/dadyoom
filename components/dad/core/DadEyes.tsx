"use client";

import { motion } from "motion/react";
import { useBlink } from "../animations/useBlink";
import { useEyeTracking } from "../animations/useEyeTracking";

export default function DadEyes() {
  const blink = useBlink();
  const eye = useEyeTracking();

  return (
    <g>
      <motion.g
        animate={{ scaleY: blink ? 0.07 : 1 }}
        transition={{ duration: 0.08 }}
        style={{ transformOrigin: "205px 240px" }}
      >
        <ellipse cx="205" cy="240" rx="34" ry="30" fill="#fff" />
        <motion.circle cx="205" cy="240" r="15" fill="#4A2E20" animate={{ x: eye.x, y: eye.y }} />
        <motion.circle cx="205" cy="240" r="8" fill="#111827" animate={{ x: eye.x, y: eye.y }} />
        <motion.circle cx="211" cy="234" r="4" fill="#fff" animate={{ x: eye.x, y: eye.y }} />
      </motion.g>

      <motion.g
        animate={{ scaleY: blink ? 0.07 : 1 }}
        transition={{ duration: 0.08 }}
        style={{ transformOrigin: "307px 240px" }}
      >
        <ellipse cx="307" cy="240" rx="34" ry="30" fill="#fff" />
        <motion.circle cx="307" cy="240" r="15" fill="#4A2E20" animate={{ x: eye.x, y: eye.y }} />
        <motion.circle cx="307" cy="240" r="8" fill="#111827" animate={{ x: eye.x, y: eye.y }} />
        <motion.circle cx="313" cy="234" r="4" fill="#fff" animate={{ x: eye.x, y: eye.y }} />
      </motion.g>
    </g>
  );
}
