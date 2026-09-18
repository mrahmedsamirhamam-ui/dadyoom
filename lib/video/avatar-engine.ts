export type AvatarEngine =
  | "echomimic-v3"
  | "musetalk"
  | "custom";

export type AvatarEngineStatus = {
  configured: boolean;
  engine: AvatarEngine;
  baseUrl: string | null;
  note: string;
};

export function avatarEngineStatus(): AvatarEngineStatus {
  const engineRaw =
    process.env.DADYOOM_AVATAR_ENGINE?.trim().toLowerCase();

  const engine: AvatarEngine =
    engineRaw === "musetalk"
      ? "musetalk"
      : engineRaw === "custom"
        ? "custom"
        : "echomimic-v3";

  const baseUrl =
    process.env.DADYOOM_AVATAR_SERVICE_URL?.trim() || null;

  return {
    configured: Boolean(baseUrl),
    engine,
    baseUrl,
    note:
      engine === "echomimic-v3"
        ? "تحريك شخص/نصف جسم بالصوت والحركة"
        : engine === "musetalk"
          ? "مزامنة شفاه سريعة للشخصيات"
          : "محرك شخصيات خارجي متوافق مع ضاديوم",
  };
}

export async function renderAvatarVideo(input: {
  imageUrl: string;
  audioUrl?: string;
  text?: string;
  title?: string;
}) {
  const status = avatarEngineStatus();

  if (!status.configured || !status.baseUrl) {
    throw new Error("AVATAR_ENGINE_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(
    30_000,
    Number(process.env.DADYOOM_AVATAR_TIMEOUT_MS ?? 600_000),
  );

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    const response = await fetch(
      `${status.baseUrl.replace(/\/+$/u, "")}/render`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.DADYOOM_AVATAR_SERVICE_TOKEN
            ? {
                Authorization:
                  `Bearer ${process.env.DADYOOM_AVATAR_SERVICE_TOKEN}`,
              }
            : {}),
        },
        body: JSON.stringify({
          engine: status.engine,
          imageUrl: input.imageUrl,
          audioUrl: input.audioUrl,
          text: input.text,
          title: input.title,
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    const payload = (await response.json()) as {
      videoUrl?: string;
      jobId?: string;
      status?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(
        payload.error ??
          `AVATAR_ENGINE_HTTP_${response.status}`,
      );
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}
