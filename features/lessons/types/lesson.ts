export type Lesson = {
  id: string;
  title: string;
  slug: string;
  lesson_number: number;
  lesson_type: string;
  summary: string | null;
  content: string;
  learning_objectives: string[];
  vocabulary: unknown[];
  instructions: string[];
  source_pdf_url: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
  estimated_minutes: number | null;
  status: string;
};