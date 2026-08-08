import fs from "node:fs/promises";
import path from "node:path";
import { generateLessonManifest } from "../data/generated-lesson-manifest";
import { extractPageRange } from "./extract-page-range";

export type ImportedLesson = {
  lessonNumber: number;
  title: string;
  slug: string;
  lessonType: string;
  sourcePdfUrl: string;
  sourcePageStart: number;
  sourcePageEnd: number;
  bookPageStart: number;
  bookPageEnd: number;
  rawText: string;
  status: "draft";
};

export async function buildLessons(
  cleanPagesFile: string,
  outputDirectory: string
): Promise<ImportedLesson[]> {
  const lessons: ImportedLesson[] = [];

  const lessonManifest = await generateLessonManifest();

  for (const item of lessonManifest) {
    const pages = await extractPageRange(
      cleanPagesFile,
      item.pdfPageStart,
      item.pdfPageEnd
    );

    lessons.push({
      lessonNumber: item.lessonNumber,
      title: item.title,
      slug: item.slug,
      lessonType: item.lessonType,
      sourcePdfUrl: "/books/ARA04Read.pdf",
      sourcePageStart: item.pdfPageStart,
      sourcePageEnd: item.pdfPageEnd,
      bookPageStart: item.bookPageStart,
      bookPageEnd: item.bookPageEnd,
      rawText: pages
        .map(
          (page) =>
            `--- PDF PAGE ${page.pageNumber} ---\n${page.text}`
        )
        .join("\n\n"),
      status: "draft",
    });
  }

  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  await fs.writeFile(
    path.join(outputDirectory, "lessons.json"),
    JSON.stringify(lessons, null, 2),
    "utf8"
  );

  for (const lesson of lessons) {
    await fs.writeFile(
      path.join(
        outputDirectory,
        `${String(lesson.lessonNumber).padStart(2, "0")}-${lesson.slug}.txt`
      ),
      lesson.rawText,
      "utf8"
    );
  }

  return lessons;
}