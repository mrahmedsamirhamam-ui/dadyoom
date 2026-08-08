import { logger } from "@/lib/logger";
import type { DadState } from "./dad-state";

const DAD_STATE_EVENT = "dadyoom:dad-state-change";

let currentState: DadState = "idle";

function setState(state: DadState): void {
  currentState = state;

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<DadState>(
        DAD_STATE_EVENT,
        {
          detail: state,
        }
      )
    );

    logger.info("DAD_STATE_CHANGED:", state);
  }
}

export const DadAI = {
  getState(): DadState {
    return currentState;
  },

  getServerState(): DadState {
    return "idle";
  },

  setState,

  idle(): void {
    setState("idle");
  },

  listen(): void {
    setState("listening");
  },

  think(): void {
    setState("thinking");
  },

  talk(): void {
    setState("talking");
  },

  read(): void {
    setState("reading");
  },

  correct(): void {
    setState("correct");
  },

  encourage(): void {
    setState("encouraging");
  },

  celebrate(): void {
    setState("celebrating");
  },

  error(): void {
    setState("error");
  },
};

export { DAD_STATE_EVENT };