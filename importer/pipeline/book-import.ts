import path from "node:path";
import fs from "node:fs/promises";
import { extractPages, savePages } from "../parser/extract-pages";
import { cleanPages } from "../cleaner/clean-pages";
import { buildLessons } from "../splitter/build-lessons";
import { analyzeLessons } from "./analyze-lessons";
import { uploadLessons } from "./upload-lessons";
import { applyAIAnalysis } from "./apply-ai-analysis";
import { importVocabulary } from "./import-vocabulary";
import { importQuestions } from "./import-questions";
import {
  completeBookImport,
  failBookImport,
  startBookImport,
} from "./track-import";
import type { BookImportContext } from "./types";

export async function importBook(context: BookImportContext) {
  // Ensure output directory structure exists
  const rawPagesDirectory = path.join(context.outputDirectory, "pages");
  const cleanPagesDirectory = path.join(context.outputDirectory, "clean-pages");
  const lessonsDirectory = path.join(context.outputDirectory, "lessons");

  await Promise.all([
    fs.mkdir(rawPagesDirectory, { recursive: true }),
    fs.mkdir(cleanPagesDirectory, { recursive: true }),
    fs.mkdir(lessonsDirectory, { recursive: true }),
  ]);

  let importId: string | null = null;

  try {
    console.log("Step 1: Read PDF & start tracking");
    const pages = await extractPages(context.pdfPath);

    importId = await startBookImport(context, pages.length);
    await savePages(pages, rawPagesDirectory);

    console.log("Step 2: Clean pages");
    const rawPagesFilePath = path.join(rawPagesDirectory, "pages.json");
    const cleanedPages = await cleanPages(rawPagesFilePath, cleanPagesDirectory);

    console.log("Step 3: Split lessons");
    const cleanPagesFilePath = path.join(cleanPagesDirectory, "clean-pages.json");
    const lessons = await buildLessons(cleanPagesFilePath, lessonsDirectory);

    console.log("Step 4: Analyze lessons with Gemini");
    const analyzedLessons = await analyzeLessons(lessons);

    console.log("Step 5: Upload to Supabase & apply enrichments");
    const uploadedLessons = await uploadLessons(context, lessons);
    const updatedLessons = await applyAIAnalysis(uploadedLessons, analyzedLessons);
    const importedVocabulary = await importVocabulary(uploadedLessons, analyzedLessons);
    const importedQuestions = await importQuestions(uploadedLessons, analyzedLessons);

    console.log("Step 6: Complete book import");
    await completeBookImport({
      importId,
      importedLessons: uploadedLessons.length,
      importedVocabulary,
      importedQuestions,
    });

    const summary = {
      pages: pages.length,
      cleanedPages: cleanedPages.length,
      lessons: lessons.length,
      analyzedLessons: analyzedLessons.length,
      uploadedLessons: uploadedLessons.length,
      updatedLessons,
      importedVocabulary,
      importedQuestions,
      importId,
    };

    console.log("Import successfully completed:", summary);
   return {
  ...summary,
  pageRecords: pages,
  cleanedPageRecords: cleanedPages,
  lessonRecords: lessons,
  analyzedLessonRecords: analyzedLessons,
};
  } catch (error) {
    if (importId) {
      await failBookImport(importId);
    }
    throw error;
  }
}
