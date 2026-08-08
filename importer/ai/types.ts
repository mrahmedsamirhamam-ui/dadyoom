export type AIQuestion = {
  question: string;
  type:
    | "multiple_choice"
    | "true_false"
    | "fill_blank";
  options: {
    id: string;
    text: string;
  }[];
  answer: string;
  explanation: string;
};

export type AILesson = {
  title: string;
  summary: string;
  objectives: string[];
  vocabulary: {
    word: string;
    meaning: string;
    example?: string;
  }[];
  questions: AIQuestion[];
};