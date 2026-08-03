"use client";

import { useEffect, useState } from "react";

export function useBlink() {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        closeTimer = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 120);
      }, 2600 + Math.random() * 2800);
    };

    schedule();

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, []);

  return blink;
}
