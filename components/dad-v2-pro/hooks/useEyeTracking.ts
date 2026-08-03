"use client";

import { useEffect, useState } from "react";

export function useEyeTracking() {
  const [point, setPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const x = Math.max(-4, Math.min(4, (event.clientX / window.innerWidth - 0.5) * 8));
      const y = Math.max(-3, Math.min(3, (event.clientY / window.innerHeight - 0.5) * 6));
      setPoint({ x, y });
    };

    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return point;
}
