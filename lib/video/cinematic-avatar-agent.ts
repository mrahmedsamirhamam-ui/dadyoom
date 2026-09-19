type HeyGenError = {
  code?: string | number;
  message?: string;
};

type HeyGenSessionEnvelope = {
  error?: HeyGenError | null;
  data?: {
    session_id?: string;
    status?:
      | "thinking"
      | "waiting_for_input"
      | "reviewing"
      | "generating"
      | "completed"
      | "failed";
    progress?: number;
    video_id?: string | null;
  };
};

type HeyGenVideoEnvelope = {
  error?: HeyGenError | null;
  data?: {
    id?: string;
    status?: "pending" | "processing" | "completed" | "failed";
    video_url?: string | null;
    thumbnail_url?: string | null;
    duration?: number | null;
    failure_message?: string | null;
  };
};

export type CinematicVideoStart = {
  sessionId: string;
  videoId?: string;
  status: "queued" | "generating" | "completed";
};

export type CinematicVideoStatus = {
  status: "queued" | "generating" | "completed" | "failed";
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  message?: string;
};

const HEYGEN_BASE_URL = "https://api.heygen.com";

function apiKey() {
  return process.env.HEYGEN_API_KEY?.trim() || "";
}

function headers() {
  const key = apiKey();

  if (!key) {
    throw new Error("CINEMATIC_VIDEO_NOT_CONFIGURED");
  }

  return {
    "X-Api-Key": key,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function publicFailure() {
  return "تعذر إنشاء الفيديو السينمائي الآن. حاول مرة أخرى بعد قليل.";
}

function sourceText(value: string | null | undefined, max: number) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, max);
}

function buildTwoAvatarPrompt(input: {
  title: string;
  summary?: string | null;
  content?: string | null;
}) {
  const title = sourceText(input.title, 180);
  const summary = sourceText(input.summary, 1800);
  const content = sourceText(input.content, 9000);

  return `
Create a polished cinematic educational video in Arabic (Modern Standard Arabic), landscape 16:9, approximately 45-70 seconds.

ABSOLUTE FORMAT REQUIREMENTS:
- This is NOT a slideshow, NOT animated text cards, and NOT a screen-recording explainer.
- Use TWO distinct lifelike avatar presenters who speak to each other as a natural dialogue.
- Presenter A: warm professional Arabic teacher, adult, calm and confident.
- Presenter B: curious student/young adult learner, respectful and expressive.
- Both characters must remain visually consistent throughout the video.
- Alternate medium shots, two-shots, over-the-shoulder shots, and natural reaction shots.
- Use accurate Arabic lip-sync, natural gestures, eye contact, and realistic pauses.
- Keep a premium cinematic educational studio look: dark teal, cream, and warm gold accents inspired by Dadyoom.
- Do not show provider branding or internal system text.
- Do not invent facts outside the supplied lesson.
- Keep any on-screen Arabic text minimal and correct.
- No copyrighted textbook page reproductions.

DIALOGUE STRUCTURE:
1. Teacher opens with one engaging question.
2. Student answers or asks for clarification.
3. Teacher explains the core idea simply.
4. Student gives or reacts to an example.
5. Teacher corrects/refines the idea.
6. Student summarizes.
7. Teacher ends with one quick challenge/question.

LESSON TITLE:
${title}

LESSON SUMMARY:
${summary || "No stored summary."}

LESSON CONTENT:
${content || "Use the title and available lesson context only."}

The final result must feel like a short acted educational scene between two real avatar characters, not a narrated presentation.
`.trim();
}

function extractError(payload: {
  error?: HeyGenError | null;
}) {
  return payload.error?.message?.trim() || "";
}

async function heyGenFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${HEYGEN_BASE_URL}${path}`,
    {
      ...init,
      headers: {
        ...headers(),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    },
  );

  const raw = await response.text();
  let payload = {} as T;

  if (raw) {
    try {
      payload = JSON.parse(raw) as T;
    } catch {
      console.error("HEYGEN_NON_JSON_RESPONSE", {
        status: response.status,
      });
    }
  }

  if (!response.ok) {
    console.error("HEYGEN_HTTP_ERROR", {
      status: response.status,
      body: raw.slice(0, 500),
    });
    throw new Error("CINEMATIC_VIDEO_PROVIDER_FAILED");
  }

  return payload;
}

export function cinematicVideoConfigured() {
  return Boolean(apiKey());
}

export async function startTwoAvatarLessonVideo(input: {
  title: string;
  summary?: string | null;
  content?: string | null;
}): Promise<CinematicVideoStart> {
  const body: Record<string, unknown> = {
    prompt: buildTwoAvatarPrompt(input),
    mode: "generate",
    orientation: "landscape",
    auto_proceed: true,
    incognito_mode: false,
  };

  const styleId =
    process.env.HEYGEN_VIDEO_STYLE_ID?.trim();

  const brandKitId =
    process.env.HEYGEN_BRAND_KIT_ID?.trim();

  if (styleId) {
    body.style_id = styleId;
  }

  if (brandKitId) {
    body.brand_kit_id = brandKitId;
  }

  const payload =
    await heyGenFetch<HeyGenSessionEnvelope>(
      "/v3/video-agents",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

  const envelopeError = extractError(payload);
  if (envelopeError) {
    console.error("HEYGEN_CREATE_ERROR", envelopeError);
    throw new Error("CINEMATIC_VIDEO_PROVIDER_FAILED");
  }

  const sessionId =
    payload.data?.session_id?.trim();

  if (!sessionId) {
    console.error("HEYGEN_CREATE_MISSING_SESSION");
    throw new Error("CINEMATIC_VIDEO_PROVIDER_FAILED");
  }

  if (payload.data?.status === "failed") {
    throw new Error("CINEMATIC_VIDEO_PROVIDER_FAILED");
  }

  const videoId =
    payload.data?.video_id?.trim() || undefined;

  return {
    sessionId,
    videoId,
    status:
      payload.data?.status === "completed"
        ? "completed"
        : "generating",
  };
}

export async function getTwoAvatarLessonVideoStatus(input: {
  sessionId: string;
  videoId?: string;
}): Promise<CinematicVideoStatus> {
  let videoId = input.videoId?.trim() || "";

  if (!videoId) {
    const session =
      await heyGenFetch<HeyGenSessionEnvelope>(
        `/v3/video-agents/${encodeURIComponent(input.sessionId)}`,
      );

    const envelopeError = extractError(session);
    if (envelopeError) {
      console.error("HEYGEN_SESSION_ERROR", envelopeError);
      return {
        status: "failed",
        message: publicFailure(),
      };
    }

    if (session.data?.status === "failed") {
      return {
        status: "failed",
        message: publicFailure(),
      };
    }

    videoId =
      session.data?.video_id?.trim() || "";

    if (!videoId) {
      return {
        status:
          session.data?.status === "thinking"
            ? "queued"
            : "generating",
      };
    }
  }

  const video =
    await heyGenFetch<HeyGenVideoEnvelope>(
      `/v3/videos/${encodeURIComponent(videoId)}`,
    );

  const envelopeError = extractError(video);
  if (envelopeError) {
    console.error("HEYGEN_VIDEO_ERROR", envelopeError);
    return {
      status: "failed",
      videoId,
      message: publicFailure(),
    };
  }

  if (video.data?.status === "failed") {
    console.error(
      "HEYGEN_VIDEO_RENDER_FAILED",
      video.data?.failure_message ?? "",
    );

    return {
      status: "failed",
      videoId,
      message: publicFailure(),
    };
  }

  if (
    video.data?.status === "completed" &&
    video.data.video_url
  ) {
    return {
      status: "completed",
      videoId,
      videoUrl: video.data.video_url,
      thumbnailUrl:
        video.data.thumbnail_url ?? undefined,
      duration:
        video.data.duration ?? undefined,
    };
  }

  return {
    status:
      video.data?.status === "pending"
        ? "queued"
        : "generating",
    videoId,
  };
}
