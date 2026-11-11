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

/** Only explicitly rights-cleared books with 2–3 teacher-reviewed questions can be approved. */
export function isBookApprovable(book: LibraryBook): boolean {
  return book.rightsStatus === "موثق" && book.questions.length >= 2 &&
    book.questions.length <= 3 && book.questions.every((q) => Boolean(q.reviewedBy.trim() && q.prompt.trim()));
}
