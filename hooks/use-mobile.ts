"use client";

import {
  useSyncExternalStore,
} from "react";

const MOBILE_BREAKPOINT = 768;

function subscribe(
  callback: () => void
): () => void {
  const mediaQuery = window.matchMedia(
    `(max-width: ${
      MOBILE_BREAKPOINT - 1
    }px)`
  );

  mediaQuery.addEventListener(
    "change",
    callback
  );

  return () => {
    mediaQuery.removeEventListener(
      "change",
      callback
    );
  };
}

function getSnapshot(): boolean {
  return window.innerWidth <
    MOBILE_BREAKPOINT;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
