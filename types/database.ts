import type { Database } from "@/types/supabase";

export type ProfileRow =
  Database["public"]["Tables"]["profiles"]["Row"];

export type EduLessonRow =
  Database["public"]["Tables"]["edu_lessons"]["Row"];

export type EduLearnerProgressRow =
  Database["public"]["Tables"]["edu_learner_progress"]["Row"];

export type EduSubjectRow =
  Database["public"]["Tables"]["edu_subjects"]["Row"];

export type EduUnitRow =
  Database["public"]["Tables"]["edu_units"]["Row"];

export type EduPointTransactionRow =
  Database["public"]["Tables"]["edu_point_transactions"]["Row"];

export type LessonRow = EduLessonRow;

export type StudentProgressRow =
  EduLearnerProgressRow;

export type LearningProfileRow =
  ProfileRow;

export type LessonDetailsRow =
  EduLessonRow;

export type QuestionRow =
  Database["public"]["Tables"]["edu_questions"]["Row"];

export type PublicLessonRow =
  Database["public"]["Tables"]["lessons"]["Row"];

export type PublicQuestionRow =
  Database["public"]["Tables"]["questions"]["Row"];

export type StudentLessonProgressRow =
  Database["public"]["Tables"]["student_lesson_progress"]["Row"];

export type StudentLearningProfileRow =
  Database["public"]["Tables"]["student_learning_profile"]["Row"];