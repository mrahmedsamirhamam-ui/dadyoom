"use client";

export type CinematicVideoResult = {
  requestId: string;
  provider: string;
  sessionId: string;
  videoId?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
};

type CreateVideoPayload = {
  requestId?: string;
  provider?: string;
  sessionId?: string;
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  status?: string;
  degraded?: boolean;
  configuredProviders?: string[];
  error?: string;
  code?: string;
};

type VideoStatusPayload = {
  provider?: string;
  status?: "queued" | "generating" | "completed" | "failed";
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  message?: string;
};

type GenerateCinematicVideoOptions = {
  prompt: string;
  lessonId?: string;
  signal?: AbortSignal;
  onStatus?: (message: string) => void;
};

function aborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException(
      "DADYOOM_VIDEO_ABORTED",
      "AbortError",
    );
  }
}

function wait(
  milliseconds: number,
  signal?: AbortSignal,
) {
  return new Promise<void>((resolve, reject) => {
    aborted(signal);

    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);

    function onAbort() {
      window.clearTimeout(timer);
      reject(
        new DOMException(
          "DADYOOM_VIDEO_ABORTED",
          "AbortError",
        ),
      );
    }

    signal?.addEventListener(
      "abort",
      onAbort,
      { once: true },
    );
  });
}

async function safeJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function generateCinematicVideo({
  prompt,
  lessonId,
  signal,
  onStatus,
}: GenerateCinematicVideoOptions): Promise<CinematicVideoResult> {
  const cleanPrompt = prompt.trim();

  if (!cleanPrompt && !lessonId) {
    throw new Error("اكتب برومبت الفيديو أولًا.");
  }

  let requestId = "";

  onStatus?.(
    "ضاد يبحث عن محرك فيديو سحابي متاح...",
  );

  for (
    let providerAttempt = 0;
    providerAttempt < 12;
    providerAttempt += 1
  ) {
    aborted(signal);

    const createResponse = await fetch(
      "/api/video/cinematic",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          ...(lessonId
            ? { lessonId }
            : {}),
          ...(cleanPrompt
            ? { prompt: cleanPrompt }
            : {}),
          ...(requestId
            ? { requestId }
            : {}),
        }),
        signal,
        cache: "no-store",
      },
    );

    const created =
      await safeJson<CreateVideoPayload>(
        createResponse,
      );

    if (
      !createResponse.ok ||
      !created.sessionId ||
      !created.provider
    ) {
      if (createResponse.status === 429) {
        throw new Error(
          created.error ??
            "وصلت إلى الحد اليومي لإنشاء الفيديو.",
        );
      }

      if (
        created.code ===
        "CINEMATIC_VIDEO_NOT_CONFIGURED"
      ) {
        throw new Error(
          "لا يوجد محرك فيديو سحابي مفعّل الآن.",
        );
      }

      throw new Error(
        created.error ??
          "تعذر بدء إنشاء الفيديو الآن.",
      );
    }

    if (created.requestId) {
      requestId =
        created.requestId;
    }

    const provider =
      created.provider;
    const sessionId =
      created.sessionId;

    let videoId =
      created.videoId ?? "";

    if (
      created.status ===
        "completed" &&
      created.videoUrl
    ) {
      onStatus?.(
        "تم إنشاء الفيديو بنجاح ✅",
      );

      return {
        requestId,
        provider,
        sessionId,
        videoId:
          videoId || undefined,
        videoUrl:
          created.videoUrl,
        thumbnailUrl:
          created.thumbnailUrl,
        duration:
          created.duration,
      };
    }

    onStatus?.(
      created.degraded
        ? "بدأ محرك سحابي احتياطي إنشاء الفيديو..."
        : "بدأ إنشاء الفيديو على السحابة...",
    );

    let providerFailed = false;

    for (
      let attempt = 0;
      attempt < 90;
      attempt += 1
    ) {
      await wait(
        attempt < 12
          ? 5000
          : 10000,
        signal,
      );

      aborted(signal);

      const query =
        new URLSearchParams({
          provider,
          sessionId,
          ...(videoId
            ? { videoId }
            : {}),
        });

      const statusResponse = await fetch(
        "/api/video/cinematic/status?" +
          query.toString(),
        {
          signal,
          cache: "no-store",
        },
      );

      const status =
        await safeJson<VideoStatusPayload>(
          statusResponse,
        );

      if (!statusResponse.ok) {
        providerFailed = true;
        break;
      }

      if (status.videoId) {
        videoId =
          status.videoId;
      }

      if (
        status.status ===
          "completed" &&
        status.videoUrl
      ) {
        onStatus?.(
          "تم إنشاء الفيديو بنجاح ✅",
        );

        return {
          requestId,
          provider,
          sessionId,
          videoId:
            videoId || undefined,
          videoUrl:
            status.videoUrl,
          thumbnailUrl:
            status.thumbnailUrl,
          duration:
            status.duration,
        };
      }

      if (
        status.status ===
        "failed"
      ) {
        providerFailed = true;
        break;
      }

      onStatus?.(
        status.status ===
          "queued"
          ? "الفيديو في قائمة المعالجة السحابية..."
          : "السحابة تُنشئ الفيديو الآن...",
      );
    }

    if (!providerFailed) {
      throw new Error(
        "إنشاء الفيديو ما زال مستمرًا على السحابة واستغرق وقتًا أطول من المتوقع.",
      );
    }

    onStatus?.(
      "المحرك الحالي لم يكمل الفيديو؛ ضاد ينتقل تلقائيًا إلى محرك آخر...",
    );
  }

  throw new Error(
    "لم يكتمل الفيديو عبر المحركات المتاحة الآن. حاول مرة أخرى لاحقًا.",
  );
}

export async function openGeneratedVideo(
  videoUrl: string,
) {
  const clean =
    videoUrl.trim();

  if (!clean) {
    return;
  }

  try {
    const [{ Capacitor }, { Browser }] =
      await Promise.all([
        import("@capacitor/core"),
        import("@capacitor/browser"),
      ]);

    if (
      Capacitor.isNativePlatform()
    ) {
      await Browser.open({
        url: clean,
        presentationStyle:
          "fullscreen",
      });
      return;
    }
  } catch {
    // Fall back to the normal browser below.
  }

  window.open(
    clean,
    "_blank",
    "noopener,noreferrer",
  );
}
