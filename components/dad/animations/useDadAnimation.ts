"use client";

import { useMemo } from "react";
import type { DadState } from "@/services/dad-ai";

export function useDadAnimation(state: DadState) {
  return useMemo(() => {
    switch (state) {
      case "thinking":
        return { y: [0, -5, 0], rotate: [-2, 2, -2], scale: [1, 1.02, 1], duration: 1.15, repeat: Infinity };
      case "talking":
      case "reading":
        return { y: [0, -4, 0], rotate: [-1.5, 1.5, -1.5], scale: [1, 1.025, 1], duration: 0.55, repeat: Infinity };
      case "celebrating":
      case "correct":
        return { y: [0, -18, 0], rotate: [-7, 7, 0], scale: [1, 1.09, 1], duration: 1.1, repeat: 0 };
      case "encouraging":
        return { x: [0, -5, 5, -4, 4, 0], y: [0, -3, 0], rotate: [0, -2, 2, 0], duration: 0.9, repeat: 0 };
      case "error":
        return { x: [0, -5, 5, -5, 5, 0], y: 0, rotate: 0, scale: 1, duration: 0.55, repeat: 0 };
      case "listening":
        return { y: [0, -2, 0], rotate: [0, -1, 1, 0], scale: [1, 1.015, 1], duration: 1.3, repeat: Infinity };
      default:
        return { y: [0, -3, 0, 2, 0], rotate: [0, -1, 0, 1, 0], scale: [1, 1.01, 1, 0.995, 1], duration: 3.2, repeat: Infinity };
    }
  }, [state]);
}
