export type LessonManifestItem = {
  lessonNumber: number;
  title: string;
  slug: string;
  lessonType:
    | "reading"
    | "writing"
    | "listening"
    | "speaking"
    | "grammar"
    | "spelling"
    | "vocabulary"
    | "assessment";
  pdfPageStart: number;
  pdfPageEnd: number;
  bookPageStart: number;
  bookPageEnd: number;
};

export const lessonManifest: LessonManifestItem[] = [
  {
    lessonNumber: 1,
    title: "اسقِ حديقةَ فلان",
    slug: "isqi-hadiqata-fulan",
    lessonType: "reading",
    pdfPageStart: 12,
    pdfPageEnd: 13,
    bookPageStart: 11,
    bookPageEnd: 12,
  },
];