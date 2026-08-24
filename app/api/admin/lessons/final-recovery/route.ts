import {
  NextResponse,
} from "next/server";

import {
  access,
  readdir,
} from "node:fs/promises";

import {
  join,
} from "node:path";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  normalizeActivity,
} from "@/lib/lesson-ai/activity-normalizer";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";


type JsonObject =
  Record<string, unknown>;

type RequestBody = {
  apply?: unknown;
};

type ActivityRow = {
  id: string;
  lesson_id: string;
  activity_order: number | null;
  title: string | null;
  activity_type: string | null;
  content: unknown;
  answer: unknown;
  is_published: boolean | null;
};

type LessonRow = {
  id: string;
  lesson_number: number | null;
  title: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
};

type Candidate = {
  title: string;
  activityType: string;
  content: JsonObject;
  answer: JsonObject;
  sourcePage: number | null;
  score: number;
};


function isObject(
  value: unknown
): value is JsonObject {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}


function objectValue(
  value: unknown
): JsonObject {
  return isObject(value)
    ? value
    : {};
}


function cleanText(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}


function numberValue(
  value: unknown
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}



const resolvedPageFolders =
  new Map<number, string>();

async function resolveImageBaseUrlForPage(
  sourcePage: number
): Promise<string | null> {
  const cached =
    resolvedPageFolders.get(
      sourcePage
    );

  if (cached) {
    return cached;
  }

  const root =
    join(
      process.cwd(),
      "public",
      "curriculum",
      "bahrain",
      "grade-01"
    );

  const filename =
    `page-${String(
      sourcePage
    ).padStart(
      3,
      "0"
    )}.jpg`;

  const entries =
    await readdir(
      root,
      {
        withFileTypes: true,
      }
    );

  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      !/^lesson-\d+$/i.test(
        entry.name
      )
    ) {
      continue;
    }

    const filePath =
      join(
        root,
        entry.name,
        filename
      );

    try {
      await access(
        filePath
      );

      const url =
        `/curriculum/bahrain/grade-01/${entry.name}`;

      resolvedPageFolders.set(
        sourcePage,
        url
      );

      return url;
    }
    catch {
      // Continue searching.
    }
  }

  return null;
}

function sourcePageFromContent(
  value: unknown
): number | null {
  const content =
    objectValue(value);

  return (
    numberValue(
      content.source_page
    ) ??
    numberValue(
      content.sourcePage
    )
  );
}


function stripArabic(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(
      /[\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .toLowerCase();
}


function titleSimilarity(
  a: string,
  b: string
): number {
  const left =
    stripArabic(a);

  const right =
    stripArabic(b);

  if (
    !left ||
    !right
  ) {
    return 0;
  }

  if (
    left === right
  ) {
    return 1;
  }

  const leftTokens =
    new Set(
      left.split(" ")
    );

  const rightTokens =
    new Set(
      right.split(" ")
    );

  const intersection =
    [
      ...leftTokens,
    ].filter(
      token =>
        rightTokens.has(token)
    ).length;

  const union =
    new Set([
      ...leftTokens,
      ...rightTokens,
    ]).size;

  return union > 0
    ? intersection / union
    : 0;
}


function collectObjects(
  value: unknown,
  output: JsonObject[] = [],
  seen:
    Set<unknown> =
      new Set()
): JsonObject[] {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return output;
  }

  if (
    seen.has(value)
  ) {
    return output;
  }

  seen.add(value);

  if (
    Array.isArray(value)
  ) {
    for (
      const item
      of value
    ) {
      collectObjects(
        item,
        output,
        seen
      );
    }

    return output;
  }

  const row =
    value as JsonObject;

  output.push(row);

  for (
    const child
    of Object.values(row)
  ) {
    collectObjects(
      child,
      output,
      seen
    );
  }

  return output;
}


function candidateFromObject(
  row: JsonObject
): Candidate | null {
  const title =
    cleanText(
      row.title
    );

  const activityType =
    cleanText(
      row.activity_type
    ) ||
    cleanText(
      row.activityType
    ) ||
    cleanText(
      row.type
    );

  const content =
    objectValue(
      row.content
    );

  const answer =
    objectValue(
      row.answer
    );

  if (
    !title ||
    !activityType ||
    Object.keys(content)
      .length === 0
  ) {
    return null;
  }

  const normalized =
    normalizeActivity({
      title,
      activity_type:
        activityType,
      content,
      answer,
    });

  const finalContent =
    normalized.changed
      ? normalized.content
      : content;

  const finalAnswer =
    normalized.changed
      ? normalized.answer
      : answer;

  const validation =
    validateActivity({
      title,
      activity_type:
        activityType,
      content:
        finalContent,
      answer:
        finalAnswer,
    });

  if (
    validation.score !== 100 ||
    validation.issues.length !== 0
  ) {
    return null;
  }

  const sourcePage =
    numberValue(
      row.source_page
    ) ??
    numberValue(
      row.sourcePage
    ) ??
    sourcePageFromContent(
      finalContent
    );

  return {
    title,
    activityType,
    content:
      finalContent,
    answer:
      finalAnswer,
    sourcePage,
    score:
      validation.score,
  };
}


function candidatesFromResponse(
  value: unknown
): Candidate[] {
  const objects =
    collectObjects(value);

  const output:
    Candidate[] = [];

  const fingerprints =
    new Set<string>();

  for (
    const row
    of objects
  ) {
    const candidate =
      candidateFromObject(row);

    if (!candidate) {
      continue;
    }

    const fingerprint =
      JSON.stringify({
        title:
          candidate.title,
        type:
          candidate.activityType,
        sourcePage:
          candidate.sourcePage,
        content:
          candidate.content,
        answer:
          candidate.answer,
      });

    if (
      fingerprints.has(
        fingerprint
      )
    ) {
      continue;
    }

    fingerprints.add(
      fingerprint
    );

    output.push(
      candidate
    );
  }

  return output;
}


function matchScore(
  activity: ActivityRow,
  candidate: Candidate
): number {
  const targetPage =
    sourcePageFromContent(
      activity.content
    );

  const titleScore =
    titleSimilarity(
      activity.title ?? "",
      candidate.title
    );

  let score =
    titleScore * 30;

  if (
    targetPage !== null &&
    candidate.sourcePage !== null
  ) {
    if (
      targetPage !==
      candidate.sourcePage
    ) {
      return -1000;
    }

    score += 100;
  }

  if (
    activity.activity_type ===
    candidate.activityType
  ) {
    score += 15;
  }

  return score;
}


function sleep(
  ms: number
) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


async function analyzeBatch(
  origin: string,
  cookie: string,
  lessonId: string,
  imageBaseUrl: string,
  batchIndex: number
) {
  const TIMEOUT_MS =
    45000;

  let lastError =
    "Unknown analysis error.";

  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {
    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () => {
          controller.abort();
        },
        TIMEOUT_MS
      );

    try {
      console.log(
        "FINAL_RECOVERY_BATCH_ATTEMPT",
        {
          lessonId,
          batchIndex,
          attempt,
        }
      );

      const response =
        await fetch(
          `${origin}/api/admin/lessons/analyze-lesson`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(cookie
                ? {
                    Cookie:
                      cookie,
                  }
                : {}),
            },

            body:
              JSON.stringify({
                lessonId,
                imageBaseUrl,
                batchSize: 4,
                batchIndex,
                planOnly: false,
              }),

            cache:
              "no-store",

            signal:
              controller.signal,
          }
        );

      clearTimeout(
        timer
      );

      const text =
        await response.text();

      let data:
        unknown;

      try {
        data =
          JSON.parse(
            text
          );
      }
      catch {
        data = {
          error:
            text,
        };
      }

      if (
        response.ok
      ) {
        console.log(
          "FINAL_RECOVERY_BATCH_SUCCESS",
          {
            lessonId,
            batchIndex,
            attempt,
          }
        );

        return data;
      }

      lastError =
        isObject(data)
          ? cleanText(
              data.error
            ) ||
            `HTTP ${response.status}`
          : `HTTP ${response.status}`;
    }
    catch (error) {
      clearTimeout(
        timer
      );

      if (
        error instanceof Error &&
        error.name ===
          "AbortError"
      ) {
        lastError =
          `Timeout after ${
            TIMEOUT_MS / 1000
          } seconds`;
      }
      else {
        lastError =
          error instanceof Error
            ? error.message
            : String(
                error
              );
      }

      console.warn(
        "FINAL_RECOVERY_BATCH_FAILED",
        {
          lessonId,
          batchIndex,
          attempt,
          error:
            lastError,
        }
      );
    }
    finally {
      clearTimeout(
        timer
      );
    }

    if (
      attempt < 3
    ) {
      await sleep(
        2500 * attempt
      );
    }
  }

  throw new Error(
    lastError
  );
}


export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as
        RequestBody;

    const apply =
      body.apply === true;

    const supabase =
      await createClient();

    const {
      data:
        activitiesData,
      error:
        activitiesError,
    } =
      await supabase
        .from(
          "lesson_activities"
        )
        .select(`
          id,
          lesson_id,
          activity_order,
          title,
          activity_type,
          content,
          answer,
          is_published
        `)
        .order(
          "lesson_id",
          {
            ascending: true,
          }
        )
        .order(
          "activity_order",
          {
            ascending: true,
          }
        );

    if (
      activitiesError
    ) {
      throw activitiesError;
    }

    const {
      data:
        lessonsData,
      error:
        lessonsError,
    } =
      await supabase
        .from(
          "lessons"
        )
        .select(`
          id,
          lesson_number,
          title,
          source_page_start,
          source_page_end
        `);

    if (
      lessonsError
    ) {
      throw lessonsError;
    }

    const activities:
      ActivityRow[] =
        (activitiesData ??
          []) as ActivityRow[];

    const lessons:
      LessonRow[] =
        (lessonsData ??
          []) as LessonRow[];

    const lessonMap =
      new Map(
        lessons.map(
          lesson => [
            lesson.id,
            lesson,
          ]
        )
      );

    const unresolved =
      activities.filter(
        activity => {
          if (
            activity.is_published ===
            true
          ) {
            return false;
          }

          const validation =
            validateActivity({
              title:
                activity.title,
              activity_type:
                activity.activity_type,
              content:
                activity.content,
              answer:
                activity.answer,
            });

          return (
            validation.issues.length >
            0
          );
        }
      );

    const targets =
      unresolved
        .map(
          activity => {
            const lesson =
              lessonMap.get(
                activity.lesson_id
              );

            if (!lesson) {
              return null;
            }

            const sourcePage =
              sourcePageFromContent(
                activity.content
              );

            const start =
              lesson.source_page_start;

            if (
              sourcePage === null ||
              start === null ||
              lesson.lesson_number ===
                null
            ) {
              return null;
            }

            const batchIndex =
              Math.floor(
                (
                  sourcePage -
                  start
                ) /
                4
              );

            if (
              batchIndex < 0
            ) {
              return null;
            }

            return {
              activity,
              lesson,
              sourcePage,
              batchIndex,
            };
          }
        )
        .filter(
          (
            item
          ): item is {
            activity:
              ActivityRow;
            lesson:
              LessonRow;
            sourcePage:
              number;
            batchIndex:
              number;
          } =>
            item !== null
        );

    const batchGroups =
      new Map<
        string,
        typeof targets
      >();

    for (
      const target
      of targets
    ) {
      const key =
        `${target.lesson.id}:${target.batchIndex}`;

      const current =
        batchGroups.get(key) ??
        [];

      current.push(
        target
      );

      batchGroups.set(
        key,
        current
      );
    }

    const origin =
      new URL(
        request.url
      ).origin;

    const cookie =
      request.headers.get(
        "cookie"
      ) ?? "";

    let batchesAnalyzed =
      0;

    let analysisFailures =
      0;

    let matched =
      0;

    let updated =
      0;

    let skipped =
      unresolved.length -
      targets.length;

    const results:
      Array<
        Record<
          string,
          unknown
        >
      > = [];

    for (
      const [
        _key,
        group
      ]
      of batchGroups
    ) {
      const first =
        group[0];

      if (!first) {
        continue;
      }
      const imageBaseUrl =
        await resolveImageBaseUrlForPage(
          first.sourcePage
        );

      if (!imageBaseUrl) {
        analysisFailures++;

        for (const target of group) {
          results.push({
            id:
              target.activity.id,

            title:
              target.activity.title,

            sourcePage:
              target.sourcePage,

            action:
              "analysis_failed",

            error:
              `PAGE_IMAGE_NOT_FOUND:${target.sourcePage}`,
          });
        }

        continue;
      }

      let analysis:
        unknown;

      try {
        analysis =
          await analyzeBatch(
            origin,
            cookie,
            first.lesson.id,
            imageBaseUrl,
            first.batchIndex
          );

        batchesAnalyzed++;
      }
      catch (error) {
        analysisFailures++;

        for (
          const target
          of group
        ) {
          results.push({
            id:
              target.activity.id,

            title:
              target.activity.title,

            action:
              "analysis_failed",

            error:
              error instanceof Error
                ? error.message
                : String(error),
          });
        }

        continue;
      }

      const candidates =
        candidatesFromResponse(
          analysis
        );

      for (
        const target
        of group
      ) {
        const before =
          validateActivity({
            title:
              target.activity.title,
            activity_type:
              target.activity
                .activity_type,
            content:
              target.activity.content,
            answer:
              target.activity.answer,
          });

        const ranked =
          candidates
            .map(
              candidate => ({
                candidate,
                score:
                  matchScore(
                    target.activity,
                    candidate
                  ),
              })
            )
            .filter(
              item =>
                item.score >= 30
            )
            .sort(
              (a, b) =>
                b.score -
                a.score
            );

        const best =
          ranked[0];

        if (!best) {
          skipped++;

          results.push({
            id:
              target.activity.id,

            title:
              target.activity.title,

            sourcePage:
              target.sourcePage,

            action:
              "no_confident_match",
          });

          continue;
        }

        const candidate =
          best.candidate;

        const after =
          validateActivity({
            title:
              target.activity.title,

            activity_type:
              candidate.activityType,

            content:
              candidate.content,

            answer:
              candidate.answer,
          });

        if (
          after.score !== 100 ||
          after.issues.length !== 0 ||
          after.score <=
            before.score
        ) {
          skipped++;

          results.push({
            id:
              target.activity.id,

            title:
              target.activity.title,

            sourcePage:
              target.sourcePage,

            action:
              "candidate_rejected",

            before:
              before.score,

            after:
              after.score,
          });

          continue;
        }

        matched++;

        if (apply) {
          const {
            error:
              updateError,
          } =
            await supabase
              .from(
                "lesson_activities"
              )
              .update({
                activity_type:
                  candidate
                    .activityType,

                content:
                  candidate
                    .content,

                answer:
                  candidate
                    .answer,

                updated_at:
                  new Date()
                    .toISOString(),
              })
              .eq(
                "id",
                target.activity.id
              )
              .eq(
                "is_published",
                false
              );

          if (
            updateError
          ) {
            results.push({
              id:
                target.activity.id,

              title:
                target.activity
                  .title,

              action:
                "update_failed",

              error:
                updateError.message,
            });

            continue;
          }

          updated++;
        }

        results.push({
          id:
            target.activity.id,

          title:
            target.activity.title,

          sourcePage:
            target.sourcePage,

          batchIndex:
            target.batchIndex,

          candidateTitle:
            candidate.title,

          candidateType:
            candidate.activityType,

          matchScore:
            best.score,

          before:
            before.score,

          after:
            after.score,

          action:
            apply
              ? "updated"
              : "would_update",
        });
      }

      /*
       * Avoid hammering Gemini between batches.
       */
      await sleep(
        750
      );
    }

    return NextResponse.json({
      ok: true,

      mode:
        apply
          ? "apply"
          : "preview",

      summary: {
        unresolvedAtStart:
          unresolved.length,

        eligibleForRecovery:
          targets.length,

        batches:
          batchGroups.size,

        batchesAnalyzed,

        analysisFailures,

        matched,

        updated,

        skipped,
      },

      results,
    });
  }
  catch (error) {
    console.error(
      "FINAL_RECOVERY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "تعذر تشغيل الاسترجاع النهائي.",
      },
      {
        status: 500,
      }
    );
  }
}
