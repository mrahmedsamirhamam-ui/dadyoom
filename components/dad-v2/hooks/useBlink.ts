"use client";

import { useEffect, useState } from "react";

export function useBlink(): boolean {
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
        }, 130);
      }, 2600 + Math.random() * 2600);
    };

    schedule();

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, []);

  return blink;
}
