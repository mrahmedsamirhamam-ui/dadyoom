"use client";

import { useEffect, useState } from "react";

export function useEyeTracking() {
  const [direction, setDirection] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = Math.max(-3.5, Math.min(3.5, (event.clientX / window.innerWidth - 0.5) * 7));
      const y = Math.max(-2.5, Math.min(2.5, (event.clientY / window.innerHeight - 0.5) * 5));
      setDirection({ x, y });
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return direction;
}
