import type { LevelDefinition } from "@/lib/constants/levels";

export interface LevelProgress {
  current: LevelDefinition;
  next: LevelDefinition | null;
  progress: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpRemaining: number;
}

export interface AwardXpParams {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  studentEmail: string;
  skill: import("@/lib/constants/skills").Skill;
  xp: number;
  reason: string;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActivityAt: Date | null;
}

export interface StreakResult extends StreakState {
  increased: boolean;
}