import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const BATCH_VIDEO_PROVIDER = "batch-factory" as const;

type BatchJobRow = {
  id: string;
  status: string;
  output_url: string | null;
  output_duration_seconds: number | null;
  error_code: string | null;
  error_message: string | null;
  attempts?: number | null;
  created_at?: string;
  updated_at?: string;
};

function compact(value: string | null | undefined, max: number) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, max);
}

function mapStatus(row: BatchJobRow) {
  const status =
    row.status === "completed"
      ? "completed"
      : row.status === "failed" || row.status === "cancelled"
        ? "failed"
        : row.status === "queued"
          ? "queued"
          : "generating";

  return {
    provider: BATCH_VIDEO_PROVIDER,
    status,
    videoId: row.id,
    videoUrl:
      status === "completed"
        ? row.output_url ?? undefined
        : undefined,
    duration:
      row.output_duration_seconds == null
        ? undefined
        : Number(row.output_duration_seconds),
    message:
      status === "failed"
        ? "تعذر إكمال الفيديو في مصنع ضاديوم المجاني. يمكنك إعادة المحاولة أو استخدام الاستوديو المحلي للدرس."
        : undefined,
  } as const;
}

export async function enqueueBatchVideo(input: {
  userId: string;
  requestId: string;
  lessonId?: string | null;
  title: string;
  summary?: string | null;
  content?: string | null;
  prompt?: string | null;
}) {
  const db = createAdminClient();

  const { data: existing, error: existingError } =
    await db
      .from("video_batch_jobs")
      .select(
        "id,status,output_url,output_duration_seconds,error_code,error_message,attempts,created_at,updated_at",
      )
      .eq("requested_by", input.userId)
      .contains("metadata", {
        request_id: input.requestId,
      })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const row =
      existing as BatchJobRow;

    if (
      (row.status === "failed" ||
        row.status === "cancelled") &&
      Number(row.attempts ?? 0) < 3
    ) {
      const {
        data: retried,
        error: retryError,
      } =
        await db
          .from("video_batch_jobs")
          .update({
            status: "queued",
            worker_id: null,
            claimed_at: null,
            started_at: null,
            completed_at: null,
            output_path: null,
            output_url: null,
            output_duration_seconds: null,
            render_seconds: null,
            gpu_seconds: null,
            error_code: null,
            error_message: null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("requested_by", input.userId)
          .select(
            "id,status,output_url,output_duration_seconds,error_code,error_message,attempts,created_at,updated_at",
          )
          .single();

      if (retryError || !retried) {
        throw retryError ??
          new Error(
            "VIDEO_BATCH_RETRY_FAILED",
          );
      }

      return mapStatus(
        retried as BatchJobRow,
      );
    }

    return mapStatus(row);
  }

  const prompt =
    compact(input.prompt, 1800) ||
    [
      "أنشئ فيديو تعليمي عربي قصير وواضح عن الدرس:",
      compact(input.title, 180),
      compact(input.summary, 900),
    ]
      .filter(Boolean)
      .join(" ");

  const narration =
    [
      compact(input.summary, 900),
      compact(input.content, 1400),
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 2200) ||
    `مرحبًا بك في ضاديوم. في هذا الفيديو نتعلم ${compact(
      input.title,
      180,
    )} بطريقة عربية واضحة وبسيطة.`;

  const { data, error } =
    await db
      .from("video_batch_jobs")
      .insert({
        requested_by: input.userId,
        lesson_id: input.lessonId || null,
        country_code: null,
        prompt_text: prompt,
        narration_text: narration,
        target_duration_seconds: 30,
        scene_seconds: 6,
        scene_count: 5,
        profile: "volume",
        model_key: "zai-org/CogVideoX-2b",
        priority: 100,
        metadata: {
          request_id: input.requestId,
          source: "interactive-fallback",
          lesson_title: compact(input.title, 180),
        },
      })
      .select(
        "id,status,output_url,output_duration_seconds,error_code,error_message,attempts,created_at,updated_at",
      )
      .single();

  if (error || !data) {
    throw error ?? new Error("VIDEO_BATCH_QUEUE_CREATE_FAILED");
  }

  return mapStatus(data as BatchJobRow);
}

export async function getBatchVideoStatus(input: {
  userId: string;
  jobId: string;
}) {
  const db = createAdminClient();

  const { data, error } =
    await db
      .from("video_batch_jobs")
      .select(
        "id,status,output_url,output_duration_seconds,error_code,error_message,attempts,created_at,updated_at",
      )
      .eq("id", input.jobId)
      .eq("requested_by", input.userId)
      .maybeSingle();

  if (error) throw error;

  if (!data) {
    return null;
  }

  const row =
    data as BatchJobRow;

  const updatedAt =
    row.updated_at
      ? new Date(row.updated_at).getTime()
      : Date.now();

  const stale =
    ["claimed", "rendering", "uploading"].includes(
      row.status,
    ) &&
    Date.now() - updatedAt >
      90 * 60_000;

  if (stale) {
    const {
      data: requeued,
      error: requeueError,
    } =
      await db
        .from("video_batch_jobs")
        .update({
          status: "queued",
          worker_id: null,
          claimed_at: null,
          started_at: null,
          error_code:
            "VIDEO_BATCH_STALE_REQUEUED",
          error_message: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("requested_by", input.userId)
        .select(
          "id,status,output_url,output_duration_seconds,error_code,error_message,attempts,created_at,updated_at",
        )
        .single();

    if (requeueError) {
      throw requeueError;
    }

    if (requeued) {
      return mapStatus(
        requeued as BatchJobRow,
      );
    }
  }

  return mapStatus(row);
}

export async function listBatchVideoHistory(
  userId: string,
  limit = 20,
) {
  const db = createAdminClient();

  const { data, error } =
    await db
      .from("video_batch_jobs")
      .select(
        "id,lesson_id,status,prompt_text,output_url,output_duration_seconds,error_code,created_at,updated_at",
      )
      .eq("requested_by", userId)
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(50, limit)));

  if (error) throw error;

  return data ?? [];
}

export async function batchVideoRuntimeHealth() {
  const db = createAdminClient();

  const { data, error } =
    await db
      .from("video_batch_jobs")
      .select("status,worker_id,updated_at")
      .order("updated_at", { ascending: false })
      .limit(25);

  if (error) {
    return {
      queueReady: false,
      workerObservedRecently: false,
      queued: 0,
      failed: 0,
      completed: 0,
    };
  }

  const rows = data ?? [];
  const recentCutoff = Date.now() - 30 * 60_000;

  return {
    queueReady: true,
    workerObservedRecently: rows.some(
      (row) =>
        Boolean(row.worker_id) &&
        new Date(String(row.updated_at ?? 0)).getTime() >= recentCutoff,
    ),
    queued: rows.filter((row) => row.status === "queued").length,
    failed: rows.filter((row) => row.status === "failed").length,
    completed: rows.filter((row) => row.status === "completed").length,
  };
}
