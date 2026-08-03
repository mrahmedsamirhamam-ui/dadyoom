"use client";

import { useEffect, useState } from "react";

export type MouthShape = "idle" | "a" | "e" | "o" | "u" | "m";

export function useLipSync(active: boolean) {
  const [shape, setShape] = useState<MouthShape>("idle");

  useEffect(() => {
    if (!active) {
      setShape("idle");
      return;
    }

    const frames: MouthShape[] = ["a", "e", "o", "u", "m", "a", "o", "e"];
    let index = 0;

    const timer = setInterval(() => {
      setShape(frames[index]);
      index = (index + 1) % frames.length;
    }, 90);

    return () => clearInterval(timer);
  }, [active]);

  return shape;
}
