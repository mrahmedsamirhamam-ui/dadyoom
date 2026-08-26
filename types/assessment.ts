export type AssessmentDifficulty =
  | "easy"
  | "medium"
  | "hard";

export type Assessment = {
  id: string;

  title: string;

  passage: string;

  question: string;

  choices: string[];

  correctAnswer: number;

  explanation: string;

  skill: string;

  difficulty: AssessmentDifficulty;

  completed: boolean;

  createdAt: string | null;
};
