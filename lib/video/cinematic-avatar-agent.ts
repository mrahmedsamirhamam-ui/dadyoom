import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type CinematicProviderId =
  | "bytez"
  | "tavus"
  | "akool"
  | "did"
  | "creatify"
  | "hf-sadtalker"
  | "hf-musetalk"
  | "hf-ltx23"
  | "hf-minimax-h3-hq"
  | "hf-minimax-h3"
  | "hf-wan22"
  | "hf-ltx"
  | "heygen"
  | "higgsfield";

export type CinematicVideoStart = {
  provider: CinematicProviderId;
  sessionId: string;
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  status: "queued" | "generating" | "completed";
  degraded?: boolean;
};

export type CinematicVideoStatus = {
  provider: CinematicProviderId;
  status: "queued" | "generating" | "completed" | "failed";
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  message?: string;
};

type LessonVideoInput = {
  title: string;
  summary?: string | null;
  content?: string | null;
  userPrompt?: string | null;
  excludeProviders?: string[];
};

type Provider = {
  id: CinematicProviderId;
  configured: () => boolean;
  start: (input: LessonVideoInput) => Promise<CinematicVideoStart>;
  status: (input: {
    sessionId: string;
    videoId?: string;
  }) => Promise<CinematicVideoStatus>;
};

const PUBLIC_FAILURE =
  "تعذر إنشاء الفيديو بهذا المحرك. سيحاول ضاديوم محركًا آخر تلقائيًا.";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function higgsfieldCredentials() {
  const combined = env("HIGGSFIELD_CREDENTIALS");

  if (combined && combined.includes(":")) {
    return combined;
  }

  const keyId =
    env("HIGGSFIELD_API_KEY_ID") ||
    env("HIGGSFIELD_API_KEY");

  const keySecret =
    env("HIGGSFIELD_API_KEY_SECRET") ||
    env("HIGGSFIELD_API_SECRET");

  return keyId && keySecret
    ? `${keyId}:${keySecret}`
    : "";
}

function higgsfieldVideoModel() {
  return (
    env("HIGGSFIELD_VIDEO_MODEL") ||
    "bytedance/seedance-2.5/text-to-video"
  );
}

function higgsfieldVideoDuration() {
  const value =
    Number(env("HIGGSFIELD_VIDEO_DURATION") || "8");

  if (!Number.isFinite(value)) {
    return 8;
  }

  return Math.max(
    4,
    Math.min(15, Math.round(value)),
  );
}

function higgsfieldGenerateAudio() {
  const value =
    env("HIGGSFIELD_VIDEO_GENERATE_AUDIO").toLowerCase();

  return !["0", "false", "no", "off"].includes(value);
}




function bytezVideoModel() {
  return (
    env("BYTEZ_VIDEO_MODEL") ||
    "Wan-AI/Wan2.1-T2V-1.3B"
  );
}

function bytezVideoModelAllowed(model: string) {
  if (
    env("BYTEZ_ALLOW_PAID_MODELS").toLowerCase() ===
    "true"
  ) {
    return true;
  }

  const allowed = new Set([
    "Wan-AI/Wan2.1-T2V-1.3B",
    ...env("BYTEZ_FREE_VIDEO_MODEL_ALLOWLIST")
      .split(/[;,\n]+/u)
      .map((value) => value.trim())
      .filter(Boolean),
  ]);

  return allowed.has(model);
}

type BytezEnvelope = {
  error?: unknown;
  output?: unknown;
};

type BytezVideoMedia = {
  url?: string;
  base64?: string;
};

function findBytezVideoMedia(
  value: unknown,
  depth = 0,
): BytezVideoMedia {
  if (depth > 5 || value == null) {
    return {};
  }

  if (typeof value === "string") {
    const clean = value.trim();

    if (
      /^https?:\/\//iu.test(clean)
    ) {
      return { url: clean };
    }

    const dataMatch =
      clean.match(
        /^data:video\/[a-z0-9.+-]+;base64,(.+)$/isu,
      );

    if (dataMatch?.[1]) {
      return {
        base64: dataMatch[1],
      };
    }

    if (
      clean.length > 1000 &&
      /^[A-Za-z0-9+/=\r\n]+$/u.test(clean)
    ) {
      return {
        base64: clean.replace(/\s+/gu, ""),
      };
    }

    return {};
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const media =
        findBytezVideoMedia(
          item,
          depth + 1,
        );

      if (
        media.url ||
        media.base64
      ) {
        return media;
      }
    }

    return {};
  }

  if (typeof value !== "object") {
    return {};
  }

  const record =
    value as Record<string, unknown>;

  for (const key of [
    "video_url",
    "videoUrl",
    "download_url",
    "output_url",
    "url",
  ]) {
    const media =
      findBytezVideoMedia(
        record[key],
        depth + 1,
      );

    if (media.url) {
      return media;
    }
  }

  for (const key of [
    "video_base64",
    "output_mp4",
    "mp4",
    "base64",
    "video",
    "output",
    "data",
  ]) {
    const media =
      findBytezVideoMedia(
        record[key],
        depth + 1,
      );

    if (
      media.url ||
      media.base64
    ) {
      return media;
    }
  }

  return {};
}

async function persistBytezVideo(
  output: unknown,
  sessionId: string,
) {
  const media =
    findBytezVideoMedia(output);

  if (media.url) {
    return media.url;
  }

  if (!media.base64) {
    throw new Error(
      "BYTEZ_VIDEO_OUTPUT_UNSUPPORTED",
    );
  }

  const bytes =
    Buffer.from(
      media.base64,
      "base64",
    );

  if (!bytes.length) {
    throw new Error(
      "BYTEZ_VIDEO_EMPTY_BINARY",
    );
  }

  const path =
    `bytez/${new Date()
      .toISOString()
      .slice(0, 10)}/${sessionId}.mp4`;

  const admin =
    createAdminClient();

  const {
    error: uploadError,
  } =
    await admin.storage
      .from(
        "generated-curriculum-videos",
      )
      .upload(
        path,
        bytes,
        {
          contentType:
            "video/mp4",
          upsert: false,
        },
      );

  if (uploadError) {
    console.error(
      "BYTEZ_VIDEO_UPLOAD_FAILED",
      uploadError.message,
    );
    throw new Error(
      "BYTEZ_VIDEO_UPLOAD_FAILED",
    );
  }

  const {
    data,
  } =
    admin.storage
      .from(
        "generated-curriculum-videos",
      )
      .getPublicUrl(path);

  if (!data.publicUrl) {
    throw new Error(
      "BYTEZ_VIDEO_PUBLIC_URL_MISSING",
    );
  }

  return data.publicUrl;
}

async function coolingProviderIds() {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await admin
      .from("video_provider_health")
      .select("provider,disabled_until")
      .gt("disabled_until", now);

    if (error) {
      console.error("VIDEO_PROVIDER_HEALTH_READ_FAILED", error.message);
      return new Set<string>();
    }

    return new Set(
      (data ?? [])
        .map((row) => String(row.provider ?? "").trim())
        .filter(Boolean),
    );
  } catch (error) {
    console.error(
      "VIDEO_PROVIDER_HEALTH_READ_FAILED",
      error instanceof Error ? error.message : error,
    );
    return new Set<string>();
  }
}

function providerCooldownMinutes(errorCode: string, failures: number) {
  if (errorCode === "VIDEO_PROVIDER_CREDITS_EXHAUSTED") return 12 * 60;
  if (errorCode === "VIDEO_PROVIDER_AUTH_FAILED") return 12 * 60;
  if (errorCode === "VIDEO_PROVIDER_RATE_LIMIT") return 15;
  if (errorCode === "VIDEO_PROVIDER_TIMEOUT") return 5;
  if (errorCode === "VIDEO_PROVIDER_SERVICE_UNAVAILABLE") return 5;
  return failures >= 3 ? 10 : 0;
}

async function recordProviderFailure(
  provider: CinematicProviderId,
  errorCode: string,
) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("video_provider_health")
      .select("consecutive_failures")
      .eq("provider", provider)
      .maybeSingle();

    const failures =
      Math.max(0, Number(data?.consecutive_failures ?? 0)) + 1;
    const cooldownMinutes =
      providerCooldownMinutes(errorCode, failures);
    const now = new Date();
    const disabledUntil =
      cooldownMinutes > 0
        ? new Date(now.getTime() + cooldownMinutes * 60_000).toISOString()
        : null;

    const { error } = await admin
      .from("video_provider_health")
      .upsert(
        {
          provider,
          consecutive_failures: failures,
          disabled_until: disabledUntil,
          last_error_code: errorCode.slice(0, 160),
          last_error_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: "provider" },
      );

    if (error) {
      console.error("VIDEO_PROVIDER_HEALTH_WRITE_FAILED", {
        provider,
        error: error.message,
      });
    }
  } catch (error) {
    console.error("VIDEO_PROVIDER_HEALTH_WRITE_FAILED", {
      provider,
      error: error instanceof Error ? error.message : error,
    });
  }
}

async function recordProviderSuccess(provider: CinematicProviderId) {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { error } = await admin
      .from("video_provider_health")
      .upsert(
        {
          provider,
          consecutive_failures: 0,
          disabled_until: null,
          last_error_code: null,
          updated_at: now,
        },
        { onConflict: "provider" },
      );

    if (error) {
      console.error("VIDEO_PROVIDER_HEALTH_RESET_FAILED", {
        provider,
        error: error.message,
      });
    }
  } catch (error) {
    console.error("VIDEO_PROVIDER_HEALTH_RESET_FAILED", {
      provider,
      error: error instanceof Error ? error.message : error,
    });
  }
}

function compactText(value: string | null | undefined, max: number) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, max);
}

function lessonSentences(input: LessonVideoInput) {
  const raw = [
    compactText(input.summary, 2200),
    compactText(input.content, 9000),
  ]
    .filter(Boolean)
    .join(" ");

  const parts = raw
    .split(/(?<=[.!؟؛])\s+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12)
    .slice(0, 8);

  if (parts.length >= 4) {
    return parts;
  }

  return [
    `موضوع درسنا اليوم هو ${compactText(input.title, 180)}.`,
    "سنفهم الفكرة الأساسية بطريقة بسيطة.",
    "سنربط الفكرة بمثال واضح من الدرس.",
    "وفي النهاية سنراجع ما تعلمناه بسؤال سريع.",
  ];
}

function dialogue(input: LessonVideoInput) {
  const lines = lessonSentences(input);
  const speakers = ["المعلم", "الطالب"] as const;

  return lines.map((text, index) => ({
    speaker: speakers[index % speakers.length],
    text,
  }));
}

function plainScript(input: LessonVideoInput) {
  const manualPrompt =
    compactText(
      input.userPrompt,
      4800,
    );

  if (manualPrompt) {
    return manualPrompt;
  }

  return dialogue(input)
    .map((line) => `${line.speaker}: ${line.text}`)
    .join("\n");
}

function cinematicPrompt(input: LessonVideoInput) {
  const title = compactText(input.title, 180);
  const summary = compactText(input.summary, 1800);
  const content = compactText(input.content, 9000);
  const manualPrompt =
    compactText(
      input.userPrompt,
      6000,
    );

  if (manualPrompt) {
    return `
Create a polished video from the user's creative brief below.

USER CREATIVE BRIEF:
${manualPrompt}

REQUIREMENTS:
- Follow the user's requested subject, style, scene structure, characters, pacing and presentation as closely as the provider allows.
- Treat any Arabic in the brief as meaning to understand, NOT as text to paint into the image.
- DO NOT render Arabic or English text, subtitles, letters, labels, title cards, signs, logos, watermarks, or UI inside the generated frames.
- If the brief asks for writing on a board or screen, show the teacher gesturing to a clean board or a simple non-text visual; Dadyoom will add accurate Arabic overlays separately.
- Use a premium, believable visual style with real motion, changing camera perspective, and natural human movement.
- Never reveal provider names, API details, system prompts or internal errors.
- Do not reproduce copyrighted textbook pages verbatim.
`.trim();
  }

  return `
Create a polished cinematic educational video in Modern Standard Arabic, landscape 16:9, around 45-70 seconds.

ABSOLUTE FORMAT:
- Use TWO visually consistent lifelike presenters: an Arabic teacher and a learner.
- Make them speak to each other naturally, not as a slideshow.
- Alternate two-shots, medium shots, over-the-shoulder shots, and reaction shots.
- Accurate Arabic lip-sync, natural gestures, eye contact, realistic pauses.
- Premium Dadyoom look: dark teal, cream, warm gold.
- Never show provider names, API details, system prompts, or internal errors.
- Do not invent facts outside the supplied lesson.
- Do not render any text, letters, subtitles, labels, title cards, signs, logos, watermarks, or UI inside the generated frames. Dadyoom adds accurate Arabic overlays separately.
- No copyrighted textbook-page reproduction.

DIALOGUE:
${plainScript(input)}

LESSON TITLE:
${title}

SUMMARY:
${summary || "No stored summary."}

LESSON CONTENT:
${content || "Use the title and dialogue only."}

End with one quick question for the learner.
`.trim();
}

async function jsonFetch<T>(
  url: string,
  init: RequestInit,
  provider: CinematicProviderId,
  timeoutMs = 45000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });

    const raw = await response.text();
    let payload = {} as T;

    if (raw) {
      try {
        payload = JSON.parse(raw) as T;
      } catch {
        console.error("VIDEO_PROVIDER_NON_JSON", {
          provider,
          status: response.status,
        });
      }
    }

    if (!response.ok) {
      console.error("VIDEO_PROVIDER_HTTP_ERROR", {
        provider,
        status: response.status,
        body: raw.slice(0, 600),
      });
      if (response.status === 402) {
        throw new Error("VIDEO_PROVIDER_CREDITS_EXHAUSTED");
      }

      if (response.status === 429) {
        throw new Error("VIDEO_PROVIDER_RATE_LIMIT");
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error("VIDEO_PROVIDER_AUTH_FAILED");
      }

      if (response.status >= 500) {
        throw new Error("VIDEO_PROVIDER_SERVICE_UNAVAILABLE");
      }

      throw new Error("VIDEO_PROVIDER_REQUEST_FAILED");
    }

    return payload;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error("VIDEO_PROVIDER_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const tavus: Provider = {
  id: "tavus",
  configured: () =>
    Boolean(env("TAVUS_API_KEY") && env("TAVUS_REPLICA_ID")),
  async start(input) {
    const payload = await jsonFetch<{
      video_id?: string;
      status?: string;
      hosted_url?: string;
      download_url?: string;
    }>(
      "https://tavusapi.com/v2/videos",
      {
        method: "POST",
        headers: {
          "x-api-key": env("TAVUS_API_KEY"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replica_id: env("TAVUS_REPLICA_ID"),
          script: plainScript(input).slice(0, 5000),
          video_name: `Dadyoom - ${compactText(input.title, 120)}`,
        }),
      },
      "tavus",
    );

    if (!payload.video_id) {
      throw new Error("TAVUS_MISSING_VIDEO_ID");
    }

    return {
      provider: "tavus",
      sessionId: payload.video_id,
      videoId: payload.video_id,
      status: payload.status === "ready" ? "completed" : "queued",
      degraded: true,
    };
  },
  async status(input) {
    const payload = await jsonFetch<{
      video_id?: string;
      status?: string;
      hosted_url?: string;
      download_url?: string;
      stream_url?: string;
      status_details?: string;
    }>(
      `https://tavusapi.com/v2/videos/${encodeURIComponent(input.videoId || input.sessionId)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": env("TAVUS_API_KEY"),
        },
      },
      "tavus",
    );

    if (payload.status === "ready") {
      return {
        provider: "tavus",
        status: "completed",
        videoId: payload.video_id || input.videoId || input.sessionId,
        videoUrl:
          payload.download_url ||
          payload.hosted_url ||
          payload.stream_url,
      };
    }

    if (payload.status === "error" || payload.status === "deleted") {
      return {
        provider: "tavus",
        status: "failed",
        message: PUBLIC_FAILURE,
      };
    }

    return {
      provider: "tavus",
      status: payload.status === "queued" ? "queued" : "generating",
      videoId: payload.video_id || input.videoId || input.sessionId,
    };
  },
};

const akool: Provider = {
  id: "akool",
  configured: () =>
    Boolean(
      env("AKOOL_API_KEY") &&
        env("AKOOL_AVATAR_ID") &&
        env("AKOOL_VOICE_ID"),
    ),
  async start(input) {
    const payload = await jsonFetch<{
      code?: number;
      msg?: string;
      data?: {
        _id?: string;
        video_status?: number;
        video?: string;
      };
    }>(
      "https://openapi.akool.com/api/open/v3/talkingavatar/create",
      {
        method: "POST",
        headers: {
          "x-api-key": env("AKOOL_API_KEY"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar_from: 2,
          avatar_id: env("AKOOL_AVATAR_ID"),
          voice_id: env("AKOOL_VOICE_ID"),
          input_text: plainScript(input).slice(0, 4800),
          width: 1280,
          height: 720,
        }),
      },
      "akool",
    );

    if (payload.code !== 1000 || !payload.data?._id) {
      console.error("AKOOL_CREATE_ERROR", {
        code: payload.code,
        msg: payload.msg,
      });
      throw new Error("AKOOL_CREATE_FAILED");
    }

    return {
      provider: "akool",
      sessionId: payload.data._id,
      videoId: payload.data._id,
      status:
        payload.data.video_status === 3
          ? "completed"
          : payload.data.video_status === 1
            ? "queued"
            : "generating",
      degraded: true,
    };
  },
  async status(input) {
    const id = input.videoId || input.sessionId;
    const payload = await jsonFetch<{
      code?: number;
      msg?: string;
      data?: {
        _id?: string;
        video_status?: number;
        video?: string;
      };
    }>(
      `https://openapi.akool.com/api/open/v3/content/video/infobymodelid?video_model_id=${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "x-api-key": env("AKOOL_API_KEY"),
        },
      },
      "akool",
    );

    if (payload.code !== 1000) {
      return {
        provider: "akool",
        status: "failed",
        message: PUBLIC_FAILURE,
      };
    }

    if (payload.data?.video_status === 3 && payload.data.video) {
      return {
        provider: "akool",
        status: "completed",
        videoId: payload.data._id || id,
        videoUrl: payload.data.video,
      };
    }

    if (payload.data?.video_status === 4) {
      return {
        provider: "akool",
        status: "failed",
        videoId: payload.data._id || id,
        message: PUBLIC_FAILURE,
      };
    }

    return {
      provider: "akool",
      status: payload.data?.video_status === 1 ? "queued" : "generating",
      videoId: payload.data?._id || id,
    };
  },
};

const did: Provider = {
  id: "did",
  configured: () =>
    Boolean(
      env("DID_API_KEY") &&
        env("DID_SOURCE_IMAGE_URL") &&
        env("DID_VOICE_ID"),
    ),
  async start(input) {
    const payload = await jsonFetch<{
      id?: string;
      status?: string;
      result_url?: string;
    }>(
      "https://api.d-id.com/talks",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${env("DID_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_url: env("DID_SOURCE_IMAGE_URL"),
          script: {
            type: "text",
            input: plainScript(input).slice(0, 5000),
            provider: {
              type: "microsoft",
              voice_id: env("DID_VOICE_ID"),
            },
          },
          name: `Dadyoom - ${compactText(input.title, 120)}`,
        }),
      },
      "did",
    );

    if (!payload.id) {
      throw new Error("DID_MISSING_TALK_ID");
    }

    return {
      provider: "did",
      sessionId: payload.id,
      videoId: payload.id,
      status: payload.status === "done" ? "completed" : "queued",
      degraded: true,
    };
  },
  async status(input) {
    const id = input.videoId || input.sessionId;
    const payload = await jsonFetch<{
      id?: string;
      status?: string;
      result_url?: string;
      error?: unknown;
    }>(
      `https://api.d-id.com/talks/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${env("DID_API_KEY")}`,
        },
      },
      "did",
    );

    if (payload.status === "done" && payload.result_url) {
      return {
        provider: "did",
        status: "completed",
        videoId: payload.id || id,
        videoUrl: payload.result_url,
      };
    }

    if (payload.status === "error" || payload.status === "rejected") {
      return {
        provider: "did",
        status: "failed",
        videoId: payload.id || id,
        message: PUBLIC_FAILURE,
      };
    }

    return {
      provider: "did",
      status: payload.status === "created" ? "queued" : "generating",
      videoId: payload.id || id,
    };
  },
};

function creatifyScenes(input: LessonVideoInput) {
  const avatarA = env("CREATIFY_AVATAR_A_ID");
  const avatarB = env("CREATIFY_AVATAR_B_ID");
  const voiceA = env("CREATIFY_VOICE_A_ID");
  const voiceB = env("CREATIFY_VOICE_B_ID");

  return dialogue(input).map((line, index) => ({
    character: {
      type: "avatar",
      avatar_id: index % 2 === 0 ? avatarA : avatarB,
      avatar_style: "normal",
      offset: {
        x: -0.15,
        y: 0.25,
      },
    },
    voice: {
      type: "text",
      input_text: line.text,
      voice_id: index % 2 === 0 ? voiceA : voiceB,
    },
  }));
}

const creatify: Provider = {
  id: "creatify",
  configured: () =>
    Boolean(
      env("CREATIFY_API_ID") &&
        env("CREATIFY_API_KEY") &&
        env("CREATIFY_AVATAR_A_ID") &&
        env("CREATIFY_AVATAR_B_ID") &&
        env("CREATIFY_VOICE_A_ID") &&
        env("CREATIFY_VOICE_B_ID"),
    ),
  async start(input) {
    const payload = await jsonFetch<{
      id?: string;
      status?: string;
      output?: string;
    }>(
      "https://api.creatify.ai/api/lipsyncs_v2/",
      {
        method: "POST",
        headers: {
          "X-API-ID": env("CREATIFY_API_ID"),
          "X-API-KEY": env("CREATIFY_API_KEY"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_inputs: creatifyScenes(input),
          aspect_ratio: "16x9",
          model_version: "standard",
          name: `Dadyoom - ${compactText(input.title, 120)}`,
        }),
      },
      "creatify",
    );

    if (!payload.id) {
      throw new Error("CREATIFY_MISSING_JOB_ID");
    }

    return {
      provider: "creatify",
      sessionId: payload.id,
      videoId: payload.id,
      status: payload.status === "done" ? "completed" : "queued",
    };
  },
  async status(input) {
    const id = input.videoId || input.sessionId;
    const payload = await jsonFetch<{
      id?: string;
      status?: string;
      output?: string | null;
      video_thumbnail?: string | null;
      duration?: number;
      failed_reason?: string | null;
    }>(
      `https://api.creatify.ai/api/lipsyncs_v2/${encodeURIComponent(id)}/`,
      {
        method: "GET",
        headers: {
          "X-API-ID": env("CREATIFY_API_ID"),
          "X-API-KEY": env("CREATIFY_API_KEY"),
        },
      },
      "creatify",
    );

    if (payload.status === "done" && payload.output) {
      return {
        provider: "creatify",
        status: "completed",
        videoId: payload.id || id,
        videoUrl: payload.output,
        thumbnailUrl: payload.video_thumbnail || undefined,
        duration: payload.duration,
      };
    }

    if (
      payload.status === "error" ||
      payload.status === "failed" ||
      payload.failed_reason
    ) {
      return {
        provider: "creatify",
        status: "failed",
        videoId: payload.id || id,
        message: PUBLIC_FAILURE,
      };
    }

    return {
      provider: "creatify",
      status: payload.status === "pending" ? "queued" : "generating",
      videoId: payload.id || id,
    };
  },
};

function hfGatewayProvider(
  id: "hf-sadtalker" | "hf-musetalk",
  urlEnv: string,
): Provider {
  return {
    id,
    configured: () => Boolean(env(urlEnv)),
    async start(input) {
      const payload = await jsonFetch<{
        id?: string;
        job_id?: string;
        status?: string;
        video_url?: string;
      }>(
        env(urlEnv),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(env("HF_TOKEN")
              ? { Authorization: `Bearer ${env("HF_TOKEN")}` }
              : {}),
          },
          body: JSON.stringify({
            title: compactText(input.title, 180),
            script: plainScript(input),
            prompt: cinematicPrompt(input),
            teacher_image_url: env("HF_TEACHER_IMAGE_URL"),
            student_image_url: env("HF_STUDENT_IMAGE_URL"),
            language: "ar",
          }),
        },
        id,
        90000,
      );

      const jobId = payload.job_id || payload.id;
      if (!jobId) {
        throw new Error("HF_AVATAR_MISSING_JOB_ID");
      }

      return {
        provider: id,
        sessionId: jobId,
        videoId: jobId,
        status: payload.status === "completed" ? "completed" : "queued",
        degraded: true,
      };
    },
    async status(input) {
      const base = env(urlEnv).replace(/\/$/u, "");
      const idValue = input.videoId || input.sessionId;
      const payload = await jsonFetch<{
        id?: string;
        job_id?: string;
        status?: string;
        video_url?: string;
        output?: string;
        error?: string;
      }>(
        `${base}/${encodeURIComponent(idValue)}`,
        {
          method: "GET",
          headers: env("HF_TOKEN")
            ? { Authorization: `Bearer ${env("HF_TOKEN")}` }
            : {},
        },
        id,
        90000,
      );

      const state = String(payload.status ?? "").toLowerCase();
      const videoUrl = payload.video_url || payload.output;

      if (
        ["completed", "done", "success"].includes(state) &&
        videoUrl
      ) {
        return {
          provider: id,
          status: "completed",
          videoId: payload.job_id || payload.id || idValue,
          videoUrl,
        };
      }

      if (["failed", "error", "rejected"].includes(state)) {
        return {
          provider: id,
          status: "failed",
          videoId: payload.job_id || payload.id || idValue,
          message: PUBLIC_FAILURE,
        };
      }

      return {
        provider: id,
        status: ["queued", "pending"].includes(state)
          ? "queued"
          : "generating",
        videoId: payload.job_id || payload.id || idValue,
      };
    },
  };
}

function hfMinimaxH3HqBaseUrl() {
  return (
    env("HF_MINIMAX_H3_HQ_BASE_URL") ||
    "https://multimodalart-minimax-h3.hf.space"
  ).replace(/\/+$/u, "");
}

const hfMinimaxH3Hq: Provider = {
  id: "hf-minimax-h3-hq",

  configured: () =>
    Boolean(
      env("HF_TOKEN") &&
      env("ENABLE_H3_HQ_VIDEO").toLowerCase() === "true",
    ),

  async start(input) {
    const baseUrl =
      hfMinimaxH3HqBaseUrl();

    const prompt =
      cinematicPrompt(
        input,
      );

    // Quality-first profile chosen to stay close to a free user's
    // daily ZeroGPU allowance while keeping a strong 16:9 frame.
    const canvas =
      env(
        "HF_MINIMAX_H3_HQ_CANVAS",
      ) ||
      "1280x704 · 16:9";
    const duration =
      Number(
        env(
          "HF_MINIMAX_H3_HQ_DURATION",
        ) ||
          "5",
      );
    const steps =
      Number(
        env(
          "HF_MINIMAX_H3_HQ_STEPS",
        ) ||
          "28",
      );

    const payload =
      await startGradioJob({
        baseUrl,
        endpoint:
          "generate",
        provider:
          "hf-minimax-h3-hq",
        preferV2: true,
        namedBody: {
          prompt,
          image_path: null,
          last_image_path:
            null,
          canvas,
          duration,
          steps,
          seed: 42,
          upsample: false,
        },
        positionalData: [
          prompt,
          null,
          null,
          canvas,
          duration,
          steps,
          42,
          false,
        ],
      });

    const eventId =
      String(
        payload.event_id ?? "",
      ).trim();

    if (!eventId) {
      throw new Error(
        "HF_MINIMAX_HQ_MISSING_EVENT_ID",
      );
    }

    return {
      provider:
        "hf-minimax-h3-hq",
      sessionId:
        eventId,
      videoId:
        eventId,
      status:
        "queued",
      degraded:
        false,
    };
  },

  async status(input) {
    const baseUrl =
      hfMinimaxH3HqBaseUrl();

    const eventId =
      input.videoId ||
      input.sessionId;

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () =>
          controller.abort(),
        8000,
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/gradio_api/call/generate/${encodeURIComponent(
            eventId,
          )}`,
          {
            method: "GET",
            headers: {
              ...hfAuthHeaders(),
              Accept:
                "text/event-stream",
            },
            signal:
              controller.signal,
            cache:
              "no-store",
          },
        );

      const raw =
        await response.text();

      if (!response.ok) {
        if (
          response.status ===
          429
        ) {
          throw new Error(
            "VIDEO_PROVIDER_RATE_LIMIT",
          );
        }

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          throw new Error(
            "VIDEO_PROVIDER_AUTH_FAILED",
          );
        }

        if (
          response.status >=
          500
        ) {
          throw new Error(
            "VIDEO_PROVIDER_SERVICE_UNAVAILABLE",
          );
        }

        throw new Error(
          "HF_MINIMAX_HQ_STATUS_FAILED",
        );
      }

      if (
        /event:\s*error/iu.test(
          raw,
        )
      ) {
        return {
          provider:
            "hf-minimax-h3-hq",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      const complete =
        gradioCompletePayload(
          raw,
        );

      if (complete) {
        const videoUrl =
          findGradioVideoUrl(
            complete,
            baseUrl,
          );

        if (videoUrl) {
          return {
            provider:
              "hf-minimax-h3-hq",
            status:
              "completed",
            videoId:
              eventId,
            videoUrl,
            duration:
              Number(
                env(
                  "HF_MINIMAX_H3_HQ_DURATION",
                ) ||
                  "5",
              ),
          };
        }

        return {
          provider:
            "hf-minimax-h3-hq",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      return {
        provider:
          "hf-minimax-h3-hq",
        status:
          /event:\s*generating|event:\s*progress/iu.test(
            raw,
          )
            ? "generating"
            : "queued",
        videoId:
          eventId,
      };
    } catch (error) {
      if (
        controller.signal
          .aborted
      ) {
        return {
          provider:
            "hf-minimax-h3-hq",
          status:
            "generating",
          videoId:
            eventId,
        };
      }

      throw error;
    } finally {
      clearTimeout(
        timer,
      );
    }
  },
};

function hfMinimaxH3BaseUrl() {
  return (
    env("HF_MINIMAX_H3_BASE_URL") ||
    "https://minimaxai-minimax-h3-turbo-lora.hf.space"
  ).replace(/\/+$/u, "");
}

function hfAuthHeaders() {
  const token =
    env("HF_TOKEN");

  return token
    ? {
        Authorization:
          `Bearer ${token}`,
      }
    : {};
}

function gradioSleep(
  milliseconds: number,
) {
  return new Promise<void>(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds,
      ),
  );
}

async function startGradioJob(options: {
  baseUrl: string;
  endpoint: string;
  provider: CinematicProviderId;
  namedBody: Record<string, unknown>;
  positionalData: unknown[];
  preferV2?: boolean;
}) {
  const variants =
    options.preferV2 === false
      ? [
          {
            url:
              `${options.baseUrl}/gradio_api/call/${options.endpoint}`,
            body: {
              data:
                options.positionalData,
            },
          },
          {
            url:
              `${options.baseUrl}/gradio_api/call/v2/${options.endpoint}`,
            body:
              options.namedBody,
          },
        ]
      : [
          {
            url:
              `${options.baseUrl}/gradio_api/call/v2/${options.endpoint}`,
            body:
              options.namedBody,
          },
          {
            url:
              `${options.baseUrl}/gradio_api/call/${options.endpoint}`,
            body: {
              data:
                options.positionalData,
            },
          },
        ];

  let lastError:
    | Error
    | undefined;

  for (const variant of variants) {
    for (
      let attempt = 0;
      attempt < 3;
      attempt += 1
    ) {
      try {
        return await jsonFetch<{
          event_id?: string;
        }>(
          variant.url,
          {
            method: "POST",
            headers: {
              ...hfAuthHeaders(),
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body:
              JSON.stringify(
                variant.body,
              ),
          },
          options.provider,
          45000,
        );
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error(
                String(error),
              );

        if (
          lastError.message ===
            "VIDEO_PROVIDER_AUTH_FAILED" ||
          lastError.message ===
            "VIDEO_PROVIDER_RATE_LIMIT" ||
          lastError.message ===
            "VIDEO_PROVIDER_CREDITS_EXHAUSTED"
        ) {
          throw lastError;
        }

        if (
          lastError.message ===
            "VIDEO_PROVIDER_SERVICE_UNAVAILABLE" &&
          attempt < 2
        ) {
          await gradioSleep(
            3500 *
              (attempt + 1),
          );
          continue;
        }

        break;
      }
    }
  }

  throw (
    lastError ??
    new Error(
      "VIDEO_PROVIDER_REQUEST_FAILED",
    )
  );
}

function findGradioVideoUrl(
  value: unknown,
  baseUrl: string,
): string | undefined {
  if (
    typeof value === "string"
  ) {
    const clean =
      value.trim();

    if (
      /^https:\/\//iu.test(clean) &&
      /\.(?:mp4|webm)(?:\?|$)/iu.test(clean)
    ) {
      return clean;
    }

    return undefined;
  }

  if (
    Array.isArray(value)
  ) {
    for (const item of value) {
      const found =
        findGradioVideoUrl(
          item,
          baseUrl,
        );

      if (found) {
        return found;
      }
    }

    return undefined;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const record =
      value as Record<string, unknown>;

    for (const key of [
      "url",
      "video_url",
      "output",
    ]) {
      const candidate =
        record[key];

      if (
        typeof candidate === "string" &&
        /^https:\/\//iu.test(
          candidate.trim(),
        )
      ) {
        return candidate.trim();
      }
    }

    const path =
      typeof record.path === "string"
        ? record.path.trim()
        : "";

    if (path) {
      return (
        `${baseUrl}/gradio_api/file=${encodeURI(
          path,
        )}`
      );
    }

    for (
      const candidate of Object.values(
        record,
      )
    ) {
      const found =
        findGradioVideoUrl(
          candidate,
          baseUrl,
        );

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function gradioCompletePayload(
  raw: string,
) {
  const blocks =
    raw.split(/\r?\n\r?\n+/u);

  for (const block of blocks) {
    if (
      !/^event:\s*complete/mu.test(
        block,
      )
    ) {
      continue;
    }

    const dataLine =
      block
        .split(/\r?\n/u)
        .find((line) =>
          line.startsWith("data:"),
        );

    if (!dataLine) {
      continue;
    }

    const json =
      dataLine
        .slice(5)
        .trim();

    try {
      return JSON.parse(
        json,
      ) as unknown;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

const hfMinimaxH3: Provider = {
  id: "hf-minimax-h3",

  configured: () =>
    Boolean(env("HF_TOKEN")),

  async start(input) {
    const baseUrl =
      hfMinimaxH3BaseUrl();

    const prompt =
      cinematicPrompt(
        input,
      );
    const canvas =
      env(
        "HF_MINIMAX_H3_CANVAS",
      ) ||
      "1344x768 · 16:9 full";
    const duration =
      Number(
        env(
          "HF_MINIMAX_H3_DURATION",
        ) ||
          "5",
      );
    const steps =
      Number(
        env(
          "HF_MINIMAX_H3_STEPS",
        ) ||
          "6",
      );

    const payload =
      await startGradioJob({
        baseUrl,
        endpoint:
          "generate",
        provider:
          "hf-minimax-h3",
        preferV2: true,
        namedBody: {
          prompt,
          image_path: null,
          last_image_path:
            null,
          canvas,
          duration,
          steps,
          seed: 42,
          upsample: false,
          use_lora: true,
        },
        positionalData: [
          prompt,
          null,
          null,
          canvas,
          duration,
          steps,
          42,
          false,
          true,
        ],
      });

    const eventId =
      String(
        payload.event_id ?? "",
      ).trim();

    if (!eventId) {
      throw new Error(
        "HF_MINIMAX_MISSING_EVENT_ID",
      );
    }

    return {
      provider:
        "hf-minimax-h3",
      sessionId:
        eventId,
      videoId:
        eventId,
      status:
        "queued",
      degraded:
        true,
    };
  },

  async status(input) {
    const baseUrl =
      hfMinimaxH3BaseUrl();

    const eventId =
      input.videoId ||
      input.sessionId;

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () =>
          controller.abort(),
        8000,
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/gradio_api/call/generate/${encodeURIComponent(
            eventId,
          )}`,
          {
            method: "GET",
            headers: {
              ...hfAuthHeaders(),
              Accept:
                "text/event-stream",
            },
            signal:
              controller.signal,
            cache:
              "no-store",
          },
        );

      const raw =
        await response.text();

      if (!response.ok) {
        if (
          response.status ===
          429
        ) {
          throw new Error(
            "VIDEO_PROVIDER_RATE_LIMIT",
          );
        }

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          throw new Error(
            "VIDEO_PROVIDER_AUTH_FAILED",
          );
        }

        if (
          response.status >=
          500
        ) {
          throw new Error(
            "VIDEO_PROVIDER_SERVICE_UNAVAILABLE",
          );
        }

        throw new Error(
          "HF_MINIMAX_STATUS_FAILED",
        );
      }

      if (
        /event:\s*error/iu.test(
          raw,
        )
      ) {
        return {
          provider:
            "hf-minimax-h3",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      const complete =
        gradioCompletePayload(
          raw,
        );

      if (complete) {
        const videoUrl =
          findGradioVideoUrl(
            complete,
            baseUrl,
          );

        if (videoUrl) {
          return {
            provider:
              "hf-minimax-h3",
            status:
              "completed",
            videoId:
              eventId,
            videoUrl,
          };
        }

        return {
          provider:
            "hf-minimax-h3",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      return {
        provider:
          "hf-minimax-h3",
        status:
          /event:\s*generating|event:\s*progress/iu.test(
            raw,
          )
            ? "generating"
            : "queued",
        videoId:
          eventId,
      };
    } catch (error) {
      if (
        controller.signal
          .aborted
      ) {
        return {
          provider:
            "hf-minimax-h3",
          status:
            "generating",
          videoId:
            eventId,
        };
      }

      throw error;
    } finally {
      clearTimeout(
        timer,
      );
    }
  },
};

function hfLtx23BaseUrl() {
  return (
    env("HF_LTX23_BASE_URL") ||
    "https://lightricks-ltx-2-3.hf.space"
  ).replace(/\/+$/u, "");
}

const hfLtx23: Provider = {
  id: "hf-ltx23",

  configured: () =>
    Boolean(env("HF_TOKEN")),

  async start(input) {
    const baseUrl =
      hfLtx23BaseUrl();

    const prompt =
      cinematicPrompt(
        input,
      );

    const duration =
      Number(
        env(
          "HF_LTX23_DURATION",
        ) ||
          "5",
      );

    const height =
      Number(
        env(
          "HF_LTX23_HEIGHT",
        ) ||
          "1024",
      );

    const width =
      Number(
        env(
          "HF_LTX23_WIDTH",
        ) ||
          "1536",
      );

    const payload =
      await startGradioJob({
        baseUrl,
        endpoint:
          "generate_video",
        provider:
          "hf-ltx23",
        preferV2: false,
        namedBody: {
          input_image: null,
          prompt,
          duration,
          enhance_prompt: false,
          seed: 42,
          randomize_seed: true,
          height,
          width,
        },
        positionalData: [
          null,
          prompt,
          duration,
          false,
          42,
          true,
          height,
          width,
        ],
      });

    const eventId =
      String(
        payload.event_id ?? "",
      ).trim();

    if (!eventId) {
      throw new Error(
        "HF_LTX23_MISSING_EVENT_ID",
      );
    }

    return {
      provider:
        "hf-ltx23",
      sessionId:
        eventId,
      videoId:
        eventId,
      status:
        "queued",
      degraded:
        false,
    };
  },

  async status(input) {
    const baseUrl =
      hfLtx23BaseUrl();

    const eventId =
      input.videoId ||
      input.sessionId;

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () =>
          controller.abort(),
        8000,
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/gradio_api/call/generate_video/${encodeURIComponent(
            eventId,
          )}`,
          {
            method: "GET",
            headers: {
              ...hfAuthHeaders(),
              Accept:
                "text/event-stream",
            },
            signal:
              controller.signal,
            cache:
              "no-store",
          },
        );

      const raw =
        await response.text();

      if (!response.ok) {
        if (
          response.status ===
          429
        ) {
          throw new Error(
            "VIDEO_PROVIDER_RATE_LIMIT",
          );
        }

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          throw new Error(
            "VIDEO_PROVIDER_AUTH_FAILED",
          );
        }

        if (
          response.status >=
          500
        ) {
          throw new Error(
            "VIDEO_PROVIDER_SERVICE_UNAVAILABLE",
          );
        }

        throw new Error(
          "HF_LTX23_STATUS_FAILED",
        );
      }

      if (
        /event:\s*error/iu.test(
          raw,
        )
      ) {
        return {
          provider:
            "hf-ltx23",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      const complete =
        gradioCompletePayload(
          raw,
        );

      if (complete) {
        const videoUrl =
          findGradioVideoUrl(
            complete,
            baseUrl,
          );

        if (videoUrl) {
          return {
            provider:
              "hf-ltx23",
            status:
              "completed",
            videoId:
              eventId,
            videoUrl,
            duration:
              Number(
                env(
                  "HF_LTX23_DURATION",
                ) ||
                  "5",
              ),
          };
        }

        return {
          provider:
            "hf-ltx23",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      return {
        provider:
          "hf-ltx23",
        status:
          /event:\s*generating|event:\s*progress/iu.test(
            raw,
          )
            ? "generating"
            : "queued",
        videoId:
          eventId,
      };
    } catch (error) {
      if (
        controller.signal
          .aborted
      ) {
        return {
          provider:
            "hf-ltx23",
          status:
            "generating",
          videoId:
            eventId,
        };
      }

      throw error;
    } finally {
      clearTimeout(
        timer,
      );
    }
  },
};

function hfLtxBaseUrl() {
  return (
    env("HF_LTX_BASE_URL") ||
    "https://lightricks-ltx-video-distilled.hf.space"
  ).replace(/\/+$/u, "");
}

const hfLtx: Provider = {
  id: "hf-ltx",

  configured: () =>
    Boolean(
      env("HF_TOKEN") &&
      env("ENABLE_LTX_VIDEO_FALLBACK").toLowerCase() === "true",
    ),

  async start(input) {
    const baseUrl =
      hfLtxBaseUrl();

    const prompt =
      cinematicPrompt(
        input,
      );
    const negativePrompt =
      "worst quality, blurry, jittery, distorted, unreadable text";
    const height =
      Number(
        env(
          "HF_LTX_HEIGHT",
        ) ||
          "512",
      );
    const width =
      Number(
        env(
          "HF_LTX_WIDTH",
        ) ||
          "704",
      );
    const duration =
      Number(
        env(
          "HF_LTX_DURATION",
        ) ||
          "2",
      );

    const payload =
      await startGradioJob({
        baseUrl,
        endpoint:
          "text_to_video",
        provider:
          "hf-ltx",
        // This Space is still on Gradio 5.x. Prefer the classic
        // data[] queue endpoint, then fall back to the v2 named API.
        preferV2: false,
        namedBody: {
          prompt,
          negative_prompt:
            negativePrompt,
          input_image_filepath:
            null,
          input_video_filepath:
            null,
          height_ui:
            height,
          width_ui:
            width,
          mode:
            "text-to-video",
          duration_ui:
            duration,
          ui_frames_to_use:
            9,
          seed_ui:
            42,
          randomize_seed:
            true,
          ui_guidance_scale:
            3,
          improve_texture_flag:
            false,
        },
        positionalData: [
          prompt,
          negativePrompt,
          null,
          null,
          height,
          width,
          "text-to-video",
          duration,
          9,
          42,
          true,
          3,
          false,
        ],
      });

    const eventId =
      String(
        payload.event_id ?? "",
      ).trim();

    if (!eventId) {
      throw new Error(
        "HF_LTX_MISSING_EVENT_ID",
      );
    }

    return {
      provider:
        "hf-ltx",
      sessionId:
        eventId,
      videoId:
        eventId,
      status:
        "queued",
      degraded:
        true,
    };
  },

  async status(input) {
    const baseUrl =
      hfLtxBaseUrl();

    const eventId =
      input.videoId ||
      input.sessionId;

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () =>
          controller.abort(),
        8000,
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/gradio_api/call/text_to_video/${encodeURIComponent(
            eventId,
          )}`,
          {
            method: "GET",
            headers: {
              ...hfAuthHeaders(),
              Accept:
                "text/event-stream",
            },
            signal:
              controller.signal,
            cache:
              "no-store",
          },
        );

      const raw =
        await response.text();

      if (!response.ok) {
        if (
          response.status ===
          429
        ) {
          throw new Error(
            "VIDEO_PROVIDER_RATE_LIMIT",
          );
        }

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          throw new Error(
            "VIDEO_PROVIDER_AUTH_FAILED",
          );
        }

        if (
          response.status >=
          500
        ) {
          throw new Error(
            "VIDEO_PROVIDER_SERVICE_UNAVAILABLE",
          );
        }

        throw new Error(
          "HF_LTX_STATUS_FAILED",
        );
      }

      if (
        /event:\s*error/iu.test(
          raw,
        )
      ) {
        return {
          provider:
            "hf-ltx",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      const complete =
        gradioCompletePayload(
          raw,
        );

      if (complete) {
        const videoUrl =
          findGradioVideoUrl(
            complete,
            baseUrl,
          );

        if (videoUrl) {
          return {
            provider:
              "hf-ltx",
            status:
              "completed",
            videoId:
              eventId,
            videoUrl,
          };
        }

        return {
          provider:
            "hf-ltx",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      return {
        provider:
          "hf-ltx",
        status:
          /event:\s*generating|event:\s*progress/iu.test(
            raw,
          )
            ? "generating"
            : "queued",
        videoId:
          eventId,
      };
    } catch (error) {
      if (
        controller.signal
          .aborted
      ) {
        return {
          provider:
            "hf-ltx",
          status:
            "generating",
          videoId:
            eventId,
        };
      }

      throw error;
    } finally {
      clearTimeout(
        timer,
      );
    }
  },
};


function hfWan22BaseUrl() {
  return (
    env("HF_WAN22_BASE_URL") ||
    "https://wan-ai-wan-2-2-5b.hf.space"
  ).replace(/\/+$/u, "");
}

const hfWan22: Provider = {
  id: "hf-wan22",

  configured: () =>
    Boolean(
      env("HF_TOKEN") &&
      env("ENABLE_WAN22_VIDEO_FALLBACK").toLowerCase() === "true",
    ),

  async start(input) {
    const baseUrl =
      hfWan22BaseUrl();

    const prompt =
      cinematicPrompt(
        input,
      );

    const payload =
      await startGradioJob({
        baseUrl,
        endpoint:
          "generate_video",
        provider:
          "hf-wan22",
        preferV2: false,
        namedBody: {
          image: null,
          prompt,
          height: 704,
          width: 1280,
          duration_seconds: 5,
          sampling_steps: 30,
          guide_scale: 5,
          shift: 5,
          seed: -1,
        },
        positionalData: [
          null,
          prompt,
          704,
          1280,
          5,
          30,
          5,
          5,
          -1,
        ],
      });

    const eventId =
      String(
        payload.event_id ?? "",
      ).trim();

    if (!eventId) {
      throw new Error(
        "HF_WAN22_MISSING_EVENT_ID",
      );
    }

    return {
      provider:
        "hf-wan22",
      sessionId:
        eventId,
      videoId:
        eventId,
      status:
        "queued",
      degraded:
        true,
    };
  },

  async status(input) {
    const baseUrl =
      hfWan22BaseUrl();

    const eventId =
      input.videoId ||
      input.sessionId;

    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () =>
          controller.abort(),
        8000,
      );

    try {
      const response =
        await fetch(
          `${baseUrl}/gradio_api/call/generate_video/${encodeURIComponent(
            eventId,
          )}`,
          {
            method: "GET",
            headers: {
              ...hfAuthHeaders(),
              Accept:
                "text/event-stream",
            },
            signal:
              controller.signal,
            cache:
              "no-store",
          },
        );

      const raw =
        await response.text();

      if (!response.ok) {
        if (
          response.status ===
          429
        ) {
          throw new Error(
            "VIDEO_PROVIDER_RATE_LIMIT",
          );
        }

        if (
          response.status ===
            401 ||
          response.status ===
            403
        ) {
          throw new Error(
            "VIDEO_PROVIDER_AUTH_FAILED",
          );
        }

        if (
          response.status >=
          500
        ) {
          throw new Error(
            "VIDEO_PROVIDER_SERVICE_UNAVAILABLE",
          );
        }

        throw new Error(
          "HF_WAN22_STATUS_FAILED",
        );
      }

      if (
        /event:\s*error/iu.test(
          raw,
        )
      ) {
        return {
          provider:
            "hf-wan22",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      const complete =
        gradioCompletePayload(
          raw,
        );

      if (complete) {
        const videoUrl =
          findGradioVideoUrl(
            complete,
            baseUrl,
          );

        if (videoUrl) {
          return {
            provider:
              "hf-wan22",
            status:
              "completed",
            videoId:
              eventId,
            videoUrl,
            duration: 5,
          };
        }

        return {
          provider:
            "hf-wan22",
          status:
            "failed",
          videoId:
            eventId,
          message:
            PUBLIC_FAILURE,
        };
      }

      return {
        provider:
          "hf-wan22",
        status:
          /event:\s*generating|event:\s*progress/iu.test(
            raw,
          )
            ? "generating"
            : "queued",
        videoId:
          eventId,
      };
    } catch (error) {
      if (
        controller.signal
          .aborted
      ) {
        return {
          provider:
            "hf-wan22",
          status:
            "generating",
          videoId:
            eventId,
        };
      }

      throw error;
    } finally {
      clearTimeout(
        timer,
      );
    }
  },
};

type HeyGenEnvelope = {
  error?: {
    code?: string | number;
    message?: string;
  } | null;
  data?: {
    session_id?: string;
    status?: string;
    video_id?: string | null;
  };
};

type HiggsfieldEnvelope = {
  status?: string;
  request_id?: string;
  status_url?: string;
  cancel_url?: string;
  video?: {
    url?: string;
  } | null;
  error?: {
    message?: string;
    code?: string | number;
  } | null;
};

const higgsfield: Provider = {
  id: "higgsfield",
  configured: () =>
    Boolean(higgsfieldCredentials()),

  async start(input) {
    const credentials =
      higgsfieldCredentials();

    if (!credentials) {
      throw new Error("HIGGSFIELD_NOT_CONFIGURED");
    }

    const model =
      higgsfieldVideoModel();

    const payload =
      await jsonFetch<HiggsfieldEnvelope>(
        `https://api.higgsfield.ai/${model}`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Key ${credentials}`,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            prompt:
              cinematicPrompt(input),
            duration:
              higgsfieldVideoDuration(),
            resolution:
              env("HIGGSFIELD_VIDEO_RESOLUTION") ||
              "720p",
            aspect_ratio:
              "16:9",
            generate_audio:
              higgsfieldGenerateAudio(),
          }),
        },
        "higgsfield",
        45000,
      );

    const requestId =
      String(
        payload.request_id ?? "",
      ).trim();

    if (!requestId) {
      throw new Error(
        "HIGGSFIELD_MISSING_REQUEST_ID",
      );
    }

    const state =
      String(
        payload.status ?? "",
      ).toLowerCase();

    return {
      provider:
        "higgsfield",
      sessionId:
        requestId,
      videoId:
        requestId,
      status:
        state === "in_progress"
          ? "generating"
          : "queued",
      degraded:
        true,
    };
  },

  async status(input) {
    const credentials =
      higgsfieldCredentials();

    if (!credentials) {
      return {
        provider:
          "higgsfield",
        status:
          "failed",
        message:
          PUBLIC_FAILURE,
      };
    }

    const requestId =
      input.videoId ||
      input.sessionId;

    const payload =
      await jsonFetch<HiggsfieldEnvelope>(
        `https://api.higgsfield.ai/requests/${encodeURIComponent(
          requestId,
        )}/status`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Key ${credentials}`,
            Accept:
              "application/json",
          },
        },
        "higgsfield",
        30000,
      );

    const state =
      String(
        payload.status ?? "",
      ).toLowerCase();

    const videoUrl =
      String(
        payload.video?.url ?? "",
      ).trim();

    if (
      state === "completed" &&
      videoUrl
    ) {
      return {
        provider:
          "higgsfield",
        status:
          "completed",
        videoId:
          requestId,
        videoUrl,
      };
    }

    if (
      [
        "failed",
        "nsfw",
        "cancelled",
        "canceled",
      ].includes(state)
    ) {
      return {
        provider:
          "higgsfield",
        status:
          "failed",
        videoId:
          requestId,
        message:
          PUBLIC_FAILURE,
      };
    }

    return {
      provider:
        "higgsfield",
      status:
        ["queued", "waiting"].includes(state)
          ? "queued"
          : "generating",
      videoId:
        requestId,
    };
  },
};

const heygen: Provider = {
  id: "heygen",
  configured: () => Boolean(env("HEYGEN_API_KEY")),
  async start(input) {
    const body: Record<string, unknown> = {
      prompt: cinematicPrompt(input),
      mode: "generate",
      orientation: "landscape",
incognito_mode: false,
    };

    if (env("HEYGEN_VIDEO_STYLE_ID")) {
      body.style_id = env("HEYGEN_VIDEO_STYLE_ID");
    }

    if (env("HEYGEN_BRAND_KIT_ID")) {
      body.brand_kit_id = env("HEYGEN_BRAND_KIT_ID");
    }

    const payload = await jsonFetch<HeyGenEnvelope>(
      "https://api.heygen.com/v3/video-agents",
      {
        method: "POST",
        headers: {
          "X-Api-Key": env("HEYGEN_API_KEY"),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      },
      "heygen",
    );

    if (payload.error?.message) {
      throw new Error("HEYGEN_CREATE_FAILED");
    }

    const sessionId = payload.data?.session_id?.trim();
    if (!sessionId) {
      throw new Error("HEYGEN_MISSING_SESSION_ID");
    }

    return {
      provider: "heygen",
      sessionId,
      videoId: payload.data?.video_id?.trim() || undefined,
      status: payload.data?.status === "completed" ? "completed" : "generating",
    };
  },
  async status(input) {
    let videoId = input.videoId?.trim() || "";

    if (!videoId) {
      const session = await jsonFetch<HeyGenEnvelope>(
        `https://api.heygen.com/v3/video-agents/${encodeURIComponent(input.sessionId)}`,
        {
          method: "GET",
          headers: {
            "X-Api-Key": env("HEYGEN_API_KEY"),
            Accept: "application/json",
          },
        },
        "heygen",
      );

      if (session.data?.status === "failed") {
        return {
          provider: "heygen",
          status: "failed",
          message: PUBLIC_FAILURE,
        };
      }

      videoId = session.data?.video_id?.trim() || "";

      if (!videoId) {
        return {
          provider: "heygen",
          status: session.data?.status === "thinking" ? "queued" : "generating",
        };
      }
    }

    const video = await jsonFetch<{
      error?: { message?: string } | null;
      data?: {
        id?: string;
        status?: string;
        video_url?: string | null;
        thumbnail_url?: string | null;
        duration?: number | null;
      };
    }>(
      `https://api.heygen.com/v3/videos/${encodeURIComponent(videoId)}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": env("HEYGEN_API_KEY"),
          Accept: "application/json",
        },
      },
      "heygen",
    );

    if (video.data?.status === "completed" && video.data.video_url) {
      return {
        provider: "heygen",
        status: "completed",
        videoId,
        videoUrl: video.data.video_url,
        thumbnailUrl: video.data.thumbnail_url || undefined,
        duration: video.data.duration || undefined,
      };
    }

    if (video.data?.status === "failed") {
      return {
        provider: "heygen",
        status: "failed",
        videoId,
        message: PUBLIC_FAILURE,
      };
    }

    return {
      provider: "heygen",
      status: video.data?.status === "pending" ? "queued" : "generating",
      videoId,
    };
  },
};


const bytez: Provider = {
  id: "bytez",

  configured: () => {
    const enabled =
      env("BYTEZ_VIDEO_ENABLED")
        .toLowerCase();

    if (
      ["0", "false", "no", "off"].includes(
        enabled,
      )
    ) {
      return false;
    }

    const model =
      bytezVideoModel();

    return Boolean(
      env("BYTEZ_API_KEY") &&
      bytezVideoModelAllowed(model),
    );
  },

  async start(input) {
    const apiKey =
      env("BYTEZ_API_KEY");
    const model =
      bytezVideoModel();

    if (
      !apiKey ||
      !bytezVideoModelAllowed(model)
    ) {
      throw new Error(
        "BYTEZ_VIDEO_NOT_CONFIGURED",
      );
    }

    const modelPath =
      model
        .split("/")
        .map((part) =>
          encodeURIComponent(part),
        )
        .join("/");

    const configuredTimeout =
      Number(
        env(
          "BYTEZ_VIDEO_TIMEOUT_MS",
        ) ||
          "240000",
      );

    const timeoutMs =
      Number.isFinite(
        configuredTimeout,
      )
        ? Math.max(
            30000,
            Math.min(
              600000,
              configuredTimeout,
            ),
          )
        : 240000;

    const payload =
      await jsonFetch<BytezEnvelope>(
        `https://api.bytez.com/models/v2/${modelPath}`,
        {
          method: "POST",
          headers: {
            Authorization:
              apiKey.trim(),
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body:
            JSON.stringify({
              text:
                cinematicPrompt(
                  input,
                ),
              json: true,
            }),
        },
        "bytez",
        timeoutMs,
      );

    if (payload.error) {
      throw new Error(
        `BYTEZ_VIDEO_ERROR:${String(
          payload.error,
        ).slice(0, 200)}`,
      );
    }

    const sessionId =
      `bytez-${Date.now().toString(
        36,
      )}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const videoUrl =
      await persistBytezVideo(
        payload.output,
        sessionId,
      );

    return {
      provider:
        "bytez",
      sessionId,
      videoId:
        sessionId,
      videoUrl,
      status:
        "completed",
      degraded:
        false,
    };
  },

  async status(input) {
    return {
      provider:
        "bytez",
      status:
        "failed",
      videoId:
        input.videoId ||
        input.sessionId,
      message:
        PUBLIC_FAILURE,
    };
  },
};

const providers: Provider[] = [
  bytez,
  tavus,
  akool,
  did,
  creatify,
  hfGatewayProvider("hf-sadtalker", "HF_SADTALKER_GATEWAY_URL"),
  hfGatewayProvider("hf-musetalk", "HF_MUSETALK_GATEWAY_URL"),
  hfLtx23,
  hfMinimaxH3Hq,
  hfMinimaxH3,
  hfWan22,
  hfLtx,
  higgsfield,
  heygen,
];

const allowedProviderIds = new Set<CinematicProviderId>(
  providers.map((provider) => provider.id),
);

export function isCinematicProviderId(
  value: string,
): value is CinematicProviderId {
  return allowedProviderIds.has(value as CinematicProviderId);
}

function configuredProviders(excluded: Set<string>) {
  const requestedOrder = env("VIDEO_PROVIDER_ORDER")
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is CinematicProviderId =>
      isCinematicProviderId(value),
    );

  const fallbackOrder: CinematicProviderId[] = [
    "bytez",
    "hf-ltx23",
    "hf-minimax-h3",
    "hf-minimax-h3-hq",
    "hf-wan22",
    "hf-ltx",
    "hf-sadtalker",
    "hf-musetalk",
    "higgsfield",
    "heygen",
    "tavus",
    "akool",
    "did",
    "creatify",
  ];

  // Respect VIDEO_PROVIDER_ORDER exactly, then append any remaining
  // configured providers as fallbacks. This lets renewable cloud
  // providers run before paid-credit engines on Android, iPhone, and web.
  const order: CinematicProviderId[] =
    Array.from(
      new Set([
        ...requestedOrder,
        ...fallbackOrder,
      ]),
    );

  const rank = new Map(order.map((id, index) => [id, index]));

  const allowPaid =
    env("ALLOW_PAID_VIDEO_PROVIDERS")
      .toLowerCase() === "true";

  const freeProviderIds =
    new Set<CinematicProviderId>([
      "bytez",
      "hf-ltx23",
      "hf-minimax-h3-hq",
      "hf-minimax-h3",
      "hf-wan22",
      "hf-ltx",
      "hf-sadtalker",
      "hf-musetalk",
    ]);

  return providers
    .filter(
      (provider) =>
        provider.configured() &&
        !excluded.has(provider.id) &&
        (
          allowPaid ||
          freeProviderIds.has(
            provider.id,
          )
        ),
    )
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999),
    );
}

export function cinematicVideoConfigured() {
  return configuredProviders(new Set()).length > 0;
}

export function configuredCinematicProviderIds() {
  return configuredProviders(new Set()).map((provider) => provider.id);
}

export async function cinematicVideoRuntimeHealth() {
  const configured =
    configuredProviders(
      new Set(),
    );

  const cooling =
    await coolingProviderIds();

  return {
    ready:
      configured.length > 0,
    configuredCount:
      configured.length,
    coolingCount:
      cooling.size,
    freeFirst:
      true,
    paidEnabled:
      env(
        "ALLOW_PAID_VIDEO_PROVIDERS",
      ).toLowerCase() ===
      "true",
  };
}

export async function startCinematicLessonVideo(
  input: LessonVideoInput,
): Promise<CinematicVideoStart> {
  const cooling = await coolingProviderIds();
  const excluded = new Set([
    ...(input.excludeProviders ?? []),
    ...cooling,
  ]);
  const candidates = configuredProviders(excluded);

  if (!candidates.length) {
    throw new Error("CINEMATIC_VIDEO_NOT_CONFIGURED");
  }

  const failures: string[] = [];

  for (const provider of candidates) {
    try {
      const result = await provider.start(input);
      await recordProviderSuccess(provider.id);
      console.info("VIDEO_PROVIDER_SELECTED", {
        provider: provider.id,
        excluded: [...excluded],
      });
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      failures.push(`${provider.id}:${message}`);
      await recordProviderFailure(provider.id, message);
      console.error("VIDEO_PROVIDER_START_FAILED", {
        provider: provider.id,
        error: message,
      });
    }
  }

  console.error("VIDEO_ALL_CONFIGURED_PROVIDERS_FAILED", failures);
  throw new Error("CINEMATIC_VIDEO_ALL_PROVIDERS_FAILED");
}

export async function getCinematicVideoStatus(input: {
  provider: CinematicProviderId;
  sessionId: string;
  videoId?: string;
}) {
  const provider = providers.find((item) => item.id === input.provider);

  if (!provider || !provider.configured()) {
    return {
      provider: input.provider,
      status: "failed" as const,
      message: PUBLIC_FAILURE,
    };
  }

  try {
    const result = await provider.status({
      sessionId: input.sessionId,
      videoId: input.videoId,
    });

    if (result.status === "completed") {
      await recordProviderSuccess(input.provider);
    } else if (result.status === "failed") {
      await recordProviderFailure(
        input.provider,
        "VIDEO_PROVIDER_RENDER_FAILED",
      );
    }

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    await recordProviderFailure(input.provider, message);

    console.error("VIDEO_PROVIDER_STATUS_FAILED", {
      provider: input.provider,
      error: message,
    });

    return {
      provider: input.provider,
      status: "failed" as const,
      message: PUBLIC_FAILURE,
    };
  }
}

// Backward-compatible aliases for older imports while the app migrates.
export const startTwoAvatarLessonVideo = startCinematicLessonVideo;

export async function getTwoAvatarLessonVideoStatus(input: {
  provider?: CinematicProviderId;
  sessionId: string;
  videoId?: string;
}) {
  return getCinematicVideoStatus({
    provider: input.provider ?? "heygen",
    sessionId: input.sessionId,
    videoId: input.videoId,
  });
}