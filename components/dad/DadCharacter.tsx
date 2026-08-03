"use client";

import { motion } from "motion/react";
import type { DadState } from "@/services/dad-ai";
import { useDadAnimation } from "./animations/useDadAnimation";
import { DadFoundation } from "./core";

type Props = {
  state: DadState;
  size?: number;
  className?: string;
};

export default function DadCharacter({
  state,
  size = 145,
  className = "",
}: Props) {
  const animation = useDadAnimation(state);

  return (
    <motion.div
      animate={{
        x: "x" in animation ? animation.x : 0,
        y: animation.y,
        rotate: animation.rotate,
        scale: "scale" in animation ? animation.scale : 1,
      }}
      transition={{
        duration: animation.duration,
        repeat: animation.repeat,
        ease: "easeInOut",
      }}
      className={className}
      style={{ transformOrigin: "50% 88%" }}
    >
      <DadFoundation state={state} size={size} />
    </motion.div>
  );
}
