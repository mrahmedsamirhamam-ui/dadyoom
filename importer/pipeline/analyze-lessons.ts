import fs from "node:fs/promises";
import path from "node:path";
import type { ImportedLesson } from "../splitter/build-lessons";
import type { AILesson } from "../ai/types";
import { analyzeLesson } from "../ai/analyze-lesson";

export type AnalyzedLesson = {
  source: ImportedLesson;
  ai: AILesson;
};

type AnalysisCheckpoint = {
  completedLessonNumbers: number[];
  analyzedLessons: AnalyzedLesson[];
};

async function readCheckpoint(
  checkpointFile: string
): Promise<AnalysisCheckpoint> {
  try {
    const raw = await fs.readFile(
      checkpointFile,
      "utf8"
    );

    const parsed = JSON.parse(
      raw
    ) as Partial<AnalysisCheckpoint>;

    return {
      completedLessonNumbers:
        Array.isArray(
          parsed.completedLessonNumbers
        )
          ? parsed.completedLessonNumbers
          : [],

      analyzedLessons:
        Array.isArray(parsed.analyzedLessons)
          ? parsed.analyzedLessons
          : [],
    };
  } catch {
    return {
      completedLessonNumbers: [],
      analyzedLessons: [],
    };
  }
}

export async function analyzeLessons(
  lessons: ImportedLesson[]
): Promise<AnalyzedLesson[]> {
  const checkpointDirectory = path.join(
    process.cwd(),
    "importer",
    "output",
    "ai-analysis"
  );

  const checkpointFile = path.join(
    checkpointDirectory,
    "checkpoint.json"
  );

  const finalFile = path.join(
    checkpointDirectory,
    "analyzed-lessons.json"
  );

  await fs.mkdir(checkpointDirectory, {
    recursive: true,
  });

  const checkpoint =
    await readCheckpoint(checkpointFile);

  const analyzedLessons = [
    ...checkpoint.analyzedLessons,
  ];

  const completed = new Set(
    checkpoint.completedLessonNumbers
  );

  for (const lesson of lessons) {
    if (completed.has(lesson.lessonNumber)) {
      console.log(
        `AI analysis already completed for lesson ${lesson.lessonNumber}`
      );

      continue;
    }

    console.log(
      `AI analyzing lesson ${lesson.lessonNumber}: ${lesson.title}`
    );

    const ai = await analyzeLesson(
      lesson.rawText
    );

    analyzedLessons.push({
      source: lesson,
      ai,
    });

    completed.add(lesson.lessonNumber);

    await fs.writeFile(
      checkpointFile,
      JSON.stringify(
        {
          completedLessonNumbers: [
            ...completed,
          ],
          analyzedLessons,
        },
        null,
        2
      ),
      "utf8"
    );

    console.log(
      `AI checkpoint saved for lesson ${lesson.lessonNumber}`
    );
  }

  const sortedLessons =
    analyzedLessons.sort(
      (first, second) =>
        first.source.lessonNumber -
        second.source.lessonNumber
    );

  await fs.writeFile(
    finalFile,
    JSON.stringify(
      sortedLessons,
      null,
      2
    ),
    "utf8"
  );

  await fs.rm(checkpointFile, {
    force: true,
  });

  return sortedLessons;
}