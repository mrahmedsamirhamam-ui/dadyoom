export const SKILLS = {
  READING: "reading",
  WRITING: "writing",
  LISTENING: "listening",
  SPEAKING: "speaking",

  GRAMMAR: "grammar",
  SPELLING: "spelling",
  VOCABULARY: "vocabulary",

  RHETORIC: "rhetoric",
  LITERATURE: "literature",
} as const;

export type Skill =
  (typeof SKILLS)[keyof typeof SKILLS];
