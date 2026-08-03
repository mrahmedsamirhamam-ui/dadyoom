import type { DadState } from "@/services/dad-ai";

import {
  getDadMotionPreset,
  type DadMotionPart,
} from "./motion-presets";

export const DadAnimationEngine = {
  getPreset(state: DadState) {
    return getDadMotionPreset(state);
  },

  getPartAnimation(
    state: DadState,
    part: DadMotionPart
  ) {
    const preset = getDadMotionPreset(state);

    return preset[part];
  },

  getBodyTransition(state: DadState) {
    return getDadMotionPreset(state).bodyTransition;
  },

  getSecondaryTransition(state: DadState) {
    return getDadMotionPreset(state)
      .secondaryTransition;
  },
};