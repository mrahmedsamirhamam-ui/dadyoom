import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type CinematicProviderId =
  | "tavus"
  | "akool"
  | "did"
  | "creatify"
  | "hf-sadtalker"
  | "hf-musetalk"
  | "heygen";

export type CinematicVideoStart = {
  provider: CinematicProviderId;
  sessionId: string;
  videoId?: string;
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
  return dialogue(input)
    .map((line) => `${line.speaker}: ${line.text}`)
    .join("\n");
}

function cinematicPrompt(input: LessonVideoInput) {
  const title = compactText(input.title, 180);
  const summary = compactText(input.summary, 1800);
  const content = compactText(input.content, 9000);

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
- Minimal, correct Arabic on-screen text.
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

const heygen: Provider = {
  id: "heygen",
  configured: () => Boolean(env("HEYGEN_API_KEY")),
  async start(input) {
    const body: Record<string, unknown> = {
      prompt: cinematicPrompt(input),
      mode: "generate",
      orientation: "landscape",
      auto_proceed: true,
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

const providers: Provider[] = [
  tavus,
  akool,
  did,
  creatify,
  hfGatewayProvider("hf-sadtalker", "HF_SADTALKER_GATEWAY_URL"),
  hfGatewayProvider("hf-musetalk", "HF_MUSETALK_GATEWAY_URL"),
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
    "hf-sadtalker",
    "hf-musetalk",
    "tavus",
    "akool",
    "did",
    "creatify",
  ];

  // Product rule: HeyGen is always the primary engine when configured.
  // VIDEO_PROVIDER_ORDER may only refine the fallback order after HeyGen.
  const requestedFallbacks = requestedOrder.filter(
    (id) => id !== "heygen",
  );

  const order: CinematicProviderId[] = [
    "heygen",
    ...requestedFallbacks,
    ...fallbackOrder.filter(
      (id) => !requestedFallbacks.includes(id),
    ),
  ];

  const rank = new Map(order.map((id, index) => [id, index]));

  return providers
    .filter((provider) => provider.configured() && !excluded.has(provider.id))
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
