import type { SupabaseClient } from "@supabase/supabase-js";
import type { Skill } from "@/lib/constants/skills";

export enum StudentEventType {
  ASSESSMENT_COMPLETED = "ASSESSMENT_COMPLETED",
  LESSON_COMPLETED = "LESSON_COMPLETED",
  LOGIN = "LOGIN",
  COURSE_COMPLETED = "COURSE_COMPLETED",
}

export interface StudentEvent {
  type: StudentEventType;

  supabase: SupabaseClient;

  studentEmail: string;

  lessonId?: string;

  courseId?: string;

  skill?: Skill;

  xp?: number;

  reason?: string;

  correct?: boolean;

  createdAt: Date;
}