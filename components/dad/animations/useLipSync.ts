"use client";

import { useEffect, useState } from "react";

export type MouthShape =
  | "idle"
  | "a"
  | "e"
  | "o"
  | "u"
  | "m";

export function useLipSync(
  active: boolean
): MouthShape {
  const [shape, setShape] =
    useState<MouthShape>("a");

  useEffect(() => {
    if (!active) {
      return;
    }

    const frames: MouthShape[] = [
      "a",
      "e",
      "o",
      "u",
      "m",
      "a",
      "o",
      "e",
    ];

    let index = 0;

    const timer = window.setInterval(() => {
      setShape(frames[index]);
      index =
        (index + 1) % frames.length;
    }, 90);

    return () => {
      window.clearInterval(timer);
    };
  }, [active]);

  return active ? shape : "idle";
}
