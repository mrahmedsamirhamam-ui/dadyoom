"use client";

import { useEffect, useState } from "react";

export function useBlink() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timer = setTimeout(() => {
        setClosed(true);
        closeTimer = setTimeout(() => {
          setClosed(false);
          schedule();
        }, 120);
      }, 2800 + Math.random() * 2600);
    };

    schedule();

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, []);

  return closed;
}
