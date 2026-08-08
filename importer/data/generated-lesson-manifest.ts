import fs from "node:fs/promises";
import path from "node:path";
import type { DetectedLesson } from "../ai/detect-lessons";

function slugifyArabicTitle(
  title: string,
  index: number
) {
  const normalized = title
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || `lesson-${index}`;
}

export async function generateLessonManifest() {
  const detectedLessonsPath = path.join(
    process.cwd(),
    "importer",
    "output",
    "detected-lessons",
    "detected-lessons.json"
  );

  const raw = await fs.readFile(
    detectedLessonsPath,
    "utf8"
  );

  const detectedLessons = JSON.parse(
    raw
  ) as DetectedLesson[];

  return detectedLessons.map(
    (lesson, index) => ({
      lessonNumber: index + 1,
      title: lesson.title.trim(),
      slug: slugifyArabicTitle(
        lesson.title,
        index + 1
      ),
      lessonType: lesson.lessonType,
      pdfPageStart:
        lesson.pdfPageStart,
      pdfPageEnd:
        lesson.pdfPageEnd,
      bookPageStart:
        Math.max(
          lesson.pdfPageStart - 1,
          1
        ),
      bookPageEnd:
        Math.max(
          lesson.pdfPageEnd - 1,
          1
        ),
    })
  );
}