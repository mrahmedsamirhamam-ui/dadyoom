/** Catalog candidates supplied by the project owner; publishing rights remain unverified. */
export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  rightsStatus: "غير متحقق منه" | "موثق";
  canPublishFullText: boolean;
  contentUrl: string | null;
  questions: readonly { id: string; prompt: string; reviewedBy: string }[];
};

export const ownerBookCandidates: readonly LibraryBook[] = [
  { id: "education-tradition-modernity", title: "التعليم بين التقليد والعصرنة", author: "أحمد سمير حمام", rightsStatus: "غير متحقق منه", canPublishFullText: false, contentUrl: null, questions: [] },
  { id: "thinking-learning-engineering", title: "هندسة التفكير والتعلّم", author: "أحمد سمير حمام", rightsStatus: "غير متحقق منه", canPublishFullText: false, contentUrl: null, questions: [] },
];

/** Catalog eligibility only; never constitutes approval of a reader's answers. */
export function isBookApprovable(book: LibraryBook): boolean {
  if (book.rightsStatus !== "موثق" || book.questions.length < 2 || book.questions.length > 3) return false;
  const ids = new Set<string>();
  for (const question of book.questions) {
    const id = question.id.trim();
    if (!id || ids.has(id) || !question.prompt.trim() || !question.reviewedBy.trim()) return false;
    ids.add(id);
  }
  return true;
}
