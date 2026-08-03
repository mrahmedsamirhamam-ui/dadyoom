"use client";

import {
  useEffect,
  useState,
} from "react";

import type { DadState } from "@/services/dad-ai/dad-state";
import {
  DadAI,
  DAD_STATE_EVENT,
} from "@/services/dad-ai/dad-engine";

export function useDadState(): DadState {
  const [dadState, setDadState] =
    useState<DadState>("idle");

  useEffect(() => {
    setDadState(DadAI.getState());

    function handleDadState(
      event: Event
    ): void {
      const customEvent =
        event as CustomEvent<DadState>;

      setDadState(customEvent.detail);
    }

    window.addEventListener(
      DAD_STATE_EVENT,
      handleDadState
    );

    return () => {
      window.removeEventListener(
        DAD_STATE_EVENT,
        handleDadState
      );
    };
  }, []);

  return dadState;
}