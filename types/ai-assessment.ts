export type AssessmentDifficulty =
  | "easy"
  | "medium"
  | "hard";

export type GeneratedAiAssessment = {
  title: string;
  passage: string;
  question: string;
  choices: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  skill: string;
  difficulty: AssessmentDifficulty;
};

export type SavedAiAssessment =
  GeneratedAiAssessment & {
    id: string;
    completed: boolean;
    createdAt: string | null;
  };
