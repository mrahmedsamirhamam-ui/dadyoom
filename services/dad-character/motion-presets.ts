import type {
  TargetAndTransition,
  Transition,
} from "motion/react";

import type { DadState } from "@/services/dad-ai";

export type DadMotionPart =
  | "body"
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg"
  | "ribbon"
  | "shadow";

export type DadMotionPreset = {
  body: TargetAndTransition;
  leftArm: TargetAndTransition;
  rightArm: TargetAndTransition;
  leftLeg: TargetAndTransition;
  rightLeg: TargetAndTransition;
  ribbon: TargetAndTransition;
  shadow: TargetAndTransition;

  bodyTransition: Transition;
  secondaryTransition: Transition;
};

const repeatingTransition: Transition = {
  duration: 3.2,
  repeat: Infinity,
  repeatType: "loop",
  ease: "easeInOut",
};

const activeTransition: Transition = {
  duration: 0.65,
  repeat: Infinity,
  repeatType: "loop",
  ease: "easeInOut",
};

const oneShotTransition: Transition = {
  duration: 1,
  repeat: 0,
  ease: "easeInOut",
};

const idlePreset: DadMotionPreset = {
  body: {
    y: [0, -5, 0, 2, 0],
    scale: [1, 1.025, 1, 0.99, 1],
    rotate: [0, -1, 0, 1, 0],
  },

  leftArm: {
    rotate: [0, -2, 0, 2, 0],
  },

  rightArm: {
    rotate: [0, 5, 0, -3, 0],
  },

  leftLeg: {
    rotate: [0, -1, 0],
  },

  rightLeg: {
    rotate: [0, 1, 0],
  },

  ribbon: {
    rotate: [0, -4, 2, -2, 0],
    y: [0, -1, 0],
  },

  shadow: {
    scaleX: [1, 0.94, 1, 1.03, 1],
    opacity: [0.2, 0.15, 0.2],
  },

  bodyTransition: repeatingTransition,

  secondaryTransition: {
    ...repeatingTransition,
    delay: 0.08,
  },
};

const thinkingPreset: DadMotionPreset = {
  body: {
    y: [0, -8, 0],
    rotate: [-4, 4, -4],
    scale: [1, 1.05, 1],
  },

  leftArm: {
    rotate: [0, -7, 0],
  },

  rightArm: {
    rotate: [0, 9, 0],
  },

  leftLeg: {
    rotate: [0, -2, 0],
  },

  rightLeg: {
    rotate: [0, 2, 0],
  },

  ribbon: {
    rotate: [-8, 8, -8],
    y: [0, -3, 0],
  },

  shadow: {
    scaleX: [1, 0.84, 1],
    opacity: [0.2, 0.12, 0.2],
  },

  bodyTransition: {
    ...activeTransition,
    duration: 0.9,
  },

  secondaryTransition: {
    ...activeTransition,
    duration: 0.9,
    delay: 0.1,
  },
};

const talkingPreset: DadMotionPreset = {
  body: {
    y: [0, -7, 0],
    rotate: [-3, 3, -3],
    scale: [1, 1.045, 1],
  },

  leftArm: {
    rotate: [-3, 5, -3],
  },

  rightArm: {
    rotate: [4, -5, 4],
  },

  leftLeg: {
    rotate: [0, -2, 0],
  },

  rightLeg: {
    rotate: [0, 2, 0],
  },

  ribbon: {
    rotate: [-10, 10, -10],
    y: [0, -3, 0],
  },

  shadow: {
    scaleX: [1, 0.88, 1],
    opacity: [0.2, 0.13, 0.2],
  },

  bodyTransition: {
    ...activeTransition,
    duration: 0.48,
  },

  secondaryTransition: {
    ...activeTransition,
    duration: 0.55,
    delay: 0.06,
  },
};

const correctPreset: DadMotionPreset = {
  body: {
    y: [0, -25, 0],
    rotate: [-8, 8, 0],
    scale: [1, 1.16, 1],
  },

  leftArm: {
    rotate: [0, -16, 8, 0],
  },

  rightArm: {
    rotate: [0, 18, -8, 0],
  },

  leftLeg: {
    rotate: [0, -7, 0],
  },

  rightLeg: {
    rotate: [0, 7, 0],
  },

  ribbon: {
    rotate: [0, -18, 14, 0],
    y: [0, -8, 0],
  },

  shadow: {
    scaleX: [1, 0.62, 1],
    opacity: [0.2, 0.07, 0.2],
  },

  bodyTransition: oneShotTransition,

  secondaryTransition: {
    ...oneShotTransition,
    delay: 0.08,
  },
};

const encouragingPreset: DadMotionPreset = {
  body: {
    x: [0, -9, 9, -7, 7, 0],
    rotate: [0, -4, 4, -3, 3, 0],
  },

  leftArm: {
    rotate: [0, -10, 6, 0],
  },

  rightArm: {
    rotate: [0, 12, -6, 0],
  },

  leftLeg: {
    rotate: [0, -3, 0],
  },

  rightLeg: {
    rotate: [0, 3, 0],
  },

  ribbon: {
    rotate: [0, -9, 9, 0],
  },

  shadow: {
    x: [0, -5, 5, 0],
    scaleX: [1, 0.95, 1],
  },

  bodyTransition: {
    ...oneShotTransition,
    duration: 0.85,
  },

  secondaryTransition: {
    ...oneShotTransition,
    duration: 0.85,
    delay: 0.06,
  },
};

const celebratingPreset: DadMotionPreset = {
  body: {
    y: [0, -32, 0, -18, 0],
    rotate: [-12, 12, -9, 9, 0],
    scale: [1, 1.22, 1.08, 1],
  },

  leftArm: {
    rotate: [-5, -25, 15, -18, 0],
  },

  rightArm: {
    rotate: [5, 25, -15, 18, 0],
  },

  leftLeg: {
    rotate: [0, -13, 7, 0],
  },

  rightLeg: {
    rotate: [0, 13, -7, 0],
  },

  ribbon: {
    rotate: [0, -26, 22, -18, 0],
    y: [0, -12, 0],
  },

  shadow: {
    scaleX: [1, 0.48, 1, 0.7, 1],
    opacity: [0.2, 0.05, 0.2],
  },

  bodyTransition: {
    ...oneShotTransition,
    duration: 1.4,
  },

  secondaryTransition: {
    ...oneShotTransition,
    duration: 1.4,
    delay: 0.08,
  },
};

const errorPreset: DadMotionPreset = {
  body: {
    x: [0, -8, 8, -7, 7, 0],
    rotate: [0, -5, 5, -4, 4, 0],
    opacity: [1, 0.72, 1],
  },

  leftArm: {
    rotate: [0, 5, -5, 0],
  },

  rightArm: {
    rotate: [0, -5, 5, 0],
  },

  leftLeg: {},
  rightLeg: {},

  ribbon: {
    rotate: [0, -7, 7, 0],
  },

  shadow: {
    scaleX: [1, 0.9, 1],
  },

  bodyTransition: {
    ...oneShotTransition,
    duration: 0.8,
  },

  secondaryTransition: {
    ...oneShotTransition,
    duration: 0.8,
    delay: 0.05,
  },
};

export const dadMotionPresets: Record<
  DadState,
  DadMotionPreset
> = {
  idle: idlePreset,
  listening: thinkingPreset,
  thinking: thinkingPreset,
  talking: talkingPreset,
  reading: talkingPreset,
  correct: correctPreset,
  encouraging: encouragingPreset,
  celebrating: celebratingPreset,
  error: errorPreset,
};

export function getDadMotionPreset(
  state: DadState
): DadMotionPreset {
  return dadMotionPresets[state] ?? idlePreset;
}
