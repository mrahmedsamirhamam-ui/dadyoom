export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Country = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
  created_at: string;
};

export type Curriculum = {
  id: string;
  country_id: string;
  name_ar: string;
  name_en: string | null;
  academic_year: string | null;
  is_active: boolean;
  created_at: string;
};

export type Grade = {
  id: string;
  curriculum_id: string;
  name_ar: string;
  name_en: string | null;
  order_no: number;
  created_at: string;
};

export type Subject = {
  id: string;
  grade_id: string;
  name_ar: string;
  name_en: string | null;
  icon: string | null;
  color: string | null;
  order_no: number;
  is_active: boolean;
  created_at: string;
};

export type Unit = {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  order_no: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  unit_id: string;
  title: string;
  slug: string;
  objective: string | null;
  content: Record<string, unknown>;
  estimated_minutes: number;
  difficulty: Difficulty;
  video_url: string | null;
  audio_url: string | null;
  order_no: number;
  points_reward: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type LearnerProgress = {
  id: string;
  student_id: string;
  lesson_id: string;
  status: "not_started" | "in_progress" | "completed";
  progress_percent: number;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_opened_at: string;
  updated_at: string;
};
