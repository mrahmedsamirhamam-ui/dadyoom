import type { Skill } from "@/lib/constants/skills";

export interface StudentProfile {
  id: string;

  email: string;

  fullName: string;

  globalXp: number;

  currentStreak: number;

  bestStreak: number;

  lastActivityAt: Date | null;

  skills: Record<Skill, number>;
}