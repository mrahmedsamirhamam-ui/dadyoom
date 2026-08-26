import fs from "node:fs/promises";
import path from "node:path";
import {
  detectLessons,
  type DetectedLesson,
} from "../ai/detect-lessons";

type CleanedPage = {
  pageNumber: number;
  text: string;
};

type DetectionCheckpoint = {
  nextStartIndex: number;
  detected: DetectedLesson[];
};

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function mergeDetectedLessons(
  lessons: DetectedLesson[]
): DetectedLesson[] {
  const unique = new Map<string, DetectedLesson>();

  for (const lesson of lessons) {
    const title = lesson.title
      .replace(/\s+/g, " ")
      .trim();

    const key = `${title}::${lesson.pdfPageStart}`;

    const existing = unique.get(key);

    if (!existing) {
      unique.set(key, {
        ...lesson,
        title,
      });

      continue;
    }

    unique.set(key, {
      ...existing,
      pdfPageEnd: Math.max(
        existing.pdfPageEnd,
        lesson.pdfPageEnd
      ),
    });
  }

  return [...unique.values()].sort(
    (first, second) =>
      first.pdfPageStart - second.pdfPageStart
  );
}

function isRateLimitError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const status =
    "status" in error
      ? Number(error.status)
      : null;

  const message =
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";

  return (
    status === 429 ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}

function isTemporaryError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const status =
    "status" in error
      ? Number(error.status)
      : null;

  const message =
    "message" in error &&
    typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    status === 500 ||
    status === 503 ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  );
}

async function detectWithRetry(
  batch: CleanedPage[],
  maximumAttempts = 3
): Promise<DetectedLesson[]> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      return await detectLessons(batch);
    } catch (error) {
      lastError = error;

      const firstPage =
        batch[0]?.pageNumber;

      const lastPage =
        batch.at(-1)?.pageNumber;

      console.error(
        `Detection attempt ${attempt}/${maximumAttempts} failed for pages ${firstPage}-${lastPage}`
      );

      if (attempt >= maximumAttempts) {
        break;
      }

      const waitMilliseconds = isRateLimitError(error)
        ? 65_000
        : isTemporaryError(error)
          ? 20_000 * attempt
          : 10_000 * attempt;

      console.log(
        `Waiting ${Math.ceil(
          waitMilliseconds / 1000
        )} seconds before retry...`
      );

      await sleep(waitMilliseconds);
    }
  }

  throw lastError;
}

async function readCheckpoint(
  checkpointFile: string
): Promise<DetectionCheckpoint> {
  try {
    const raw = await fs.readFile(
      checkpointFile,
      "utf8"
    );

    const checkpoint = JSON.parse(
      raw
    ) as Partial<DetectionCheckpoint>;

    return {
      nextStartIndex:
        checkpoint.nextStartIndex ?? 0,

      detected: Array.isArray(
        checkpoint.detected
      )
        ? checkpoint.detected
        : [],
    };
  } catch {
    return {
      nextStartIndex: 0,
      detected: [],
    };
  }
}

export async function detectBookLessons(
  cleanPagesFile: string,
  outputDirectory: string
): Promise<DetectedLesson[]> {
  await fs.mkdir(outputDirectory, {
    recursive: true,
  });

  const checkpointFile = path.join(
    outputDirectory,
    "checkpoint.json"
  );

  const outputFile = path.join(
    outputDirectory,
    "detected-lessons.json"
  );

  const raw = await fs.readFile(
    cleanPagesFile,
    "utf8"
  );

  const pages = JSON.parse(
    raw
  ) as CleanedPage[];

  const checkpoint =
    await readCheckpoint(checkpointFile);

  const detected = [
    ...checkpoint.detected,
  ];

  const batchSize = 8;
  const overlap = 1;
  const step = batchSize - overlap;

  console.log(
    `Resuming from page index: ${checkpoint.nextStartIndex}`
  );

  for (
    let start = checkpoint.nextStartIndex;
    start < pages.length;
    start += step
  ) {
    const batch = pages.slice(
      start,
      start + batchSize
    );

    if (batch.length === 0) {
      break;
    }

    const firstPage =
      batch[0].pageNumber;

    const lastPage =
      batch.at(-1)?.pageNumber ??
      firstPage;

    console.log(
      `Detecting lessons in PDF pages ${firstPage}-${lastPage}`
    );

    const batchLessons =
      await detectWithRetry(batch);

    detected.push(...batchLessons);

    const nextStartIndex = start + step;

    await fs.writeFile(
      checkpointFile,
      JSON.stringify(
        {
          nextStartIndex,
          detected,
        },
        null,
        2
      ),
      "utf8"
    );

    console.log(
      `Checkpoint saved. Next page index: ${nextStartIndex}`
    );

    // يمنع تجاوز حد خمسة طلبات في الدقيقة
    await sleep(15_000);
  }

  const lessons =
    mergeDetectedLessons(detected);

  await fs.writeFile(
    outputFile,
    JSON.stringify(
      lessons,
      null,
      2
    ),
    "utf8"
  );

  await fs.rm(checkpointFile, {
    force: true,
  });

  console.log(
    `Detected lessons: ${lessons.length}`
  );

  console.log(`Output: ${outputFile}`);

  return lessons;
}
