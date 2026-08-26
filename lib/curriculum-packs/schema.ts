
export type CurriculumPackQuestion = {
  question: string;
  type: "multiple_choice";
  options: Array<{ id: string; text: string }>;
  correctAnswer: string;
  explanation?: string | null;
  points?: number;
};

export type CurriculumPackVocabulary = {
  word: string;
  meaning: string;
  example?: string | null;
};

export type CurriculumPackLesson = {
  number: number;
  title: string;
  type: "reading" | "writing" | "listening" | "speaking" | "grammar" | "vocabulary";
  estimatedMinutes?: number;
  summary: string;
  content: string;
  objectives: string[];
  vocabulary: CurriculumPackVocabulary[];
  questions: CurriculumPackQuestion[];
  source?: { label?: string | null; url?: string | null; pageStart?: number | null; pageEnd?: number | null };
};

export type CurriculumPackUnit = {
  number: number;
  title: string;
  description?: string | null;
  lessons: CurriculumPackLesson[];
};

export type CurriculumPack = {
  schemaVersion: 1;
  packKey: string;
  country: { code: string; nameAr: string; nameEn?: string | null };
  academicYear: string;
  subject: { code: "arabic"; nameAr: "اللغة العربية" };
  stage: { code: string; nameAr: string };
  grade: { number: number; nameAr: string; nameEn?: string | null };
  semester: 1 | 2 | 3 | null;
  curriculum: { nameAr: string; nameEn?: string | null; description?: string | null };
  rights: {
    contentOwner: "dadyoom" | "licensed" | "public-domain";
    sourceLabel: string;
    sourceUrl?: string | null;
    verified: boolean;
  };
  units: CurriculumPackUnit[];
};
