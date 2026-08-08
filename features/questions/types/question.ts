export type QuestionOption = {
  id: string;
  text: string;
};

export type LessonQuestion = {
  id: string;
  lesson_id: string;
  question_order: number;
  question: string;
  question_type: string;
  options: QuestionOption[];
  correct_answer: string;
  explanation: string | null;
  points: number;
};