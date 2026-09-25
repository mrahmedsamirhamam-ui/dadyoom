import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthMode = "raw" | "key-prefix" | "none";

const TARGET_MODELS = [
  "Qwen/Qwen3-4B",
  "Qwen/Qwen3-4B-Instruct-2507",
  "ali-vilab/text-to-video-ms-1.7b",
] as const;

function authHeader(key: string, mode: Exclude<AuthMode, "none">) {
  return mode === "raw" ? key : `Key ${key}`;
}

async function probe(
  url: string,
  key: string,
  mode: Exclude<AuthMode, "none">,
) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authHeader(key, mode),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();

  return {
    status: response.status,
    ok: response.ok,
    text,
  };
}

export async function GET() {
  const key = process.env.BYTEZ_API_KEY?.trim();

  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        authOk: false,
        authMode: "none" satisfies AuthMode,
      },
      { status: 503 },
    );
  }

  const baseUrl =
    process.env.BYTEZ_BASE_URL?.trim().replace(/\/+$/u, "") ||
    "https://api.bytez.com";

  try {
    let authMode: AuthMode = "none";
    let tasksProbe = await probe(
      `${baseUrl}/models/v2/list/tasks`,
      key,
      "raw",
    );

    if (!tasksProbe.ok && [401, 403].includes(tasksProbe.status)) {
      const prefixed = await probe(
        `${baseUrl}/models/v2/list/tasks`,
        key,
        "key-prefix",
      );

      if (prefixed.ok) {
        authMode = "key-prefix";
        tasksProbe = prefixed;
      }
    } else if (tasksProbe.ok) {
      authMode = "raw";
    }

    if (!tasksProbe.ok || authMode === "none") {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          authOk: false,
          authMode,
          tasksStatus: tasksProbe.status,
        },
        {
          status: tasksProbe.status >= 400 ? tasksProbe.status : 502,
        },
      );
    }

    const textModelsResponse = await fetch(
      `${baseUrl}/models/v2/list/models?task=text-generation`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader(key, authMode),
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const videoModelsResponse = await fetch(
      `${baseUrl}/models/v2/list/models?task=text-to-video`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader(key, authMode),
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const textModelsText = await textModelsResponse.text();
    const videoModelsText = await videoModelsResponse.text();

    function parseModelIds(raw: string): string[] {
      try {
        const parsed = JSON.parse(raw) as {
          output?: Array<{
            modelId?: string;
            meter?: string;
          }>;
        };

        return (parsed.output ?? [])
          .map((item) => String(item.modelId ?? "").trim())
          .filter(Boolean);
      } catch {
        return [];
      }
    }

    const textModelIds =
      textModelsResponse.ok
        ? parseModelIds(textModelsText)
        : [];

    const videoModelIds =
      videoModelsResponse.ok
        ? parseModelIds(videoModelsText)
        : [];

    const allModelIds = new Set([
      ...textModelIds,
      ...videoModelIds,
    ]);

    const catalogHealthy =
      textModelsResponse.ok ||
      videoModelsResponse.ok;

    const modelAvailability = Object.fromEntries(
      TARGET_MODELS.map((model) => [
        model,
        catalogHealthy
          ? allModelIds.has(model)
          : null,
      ]),
    );

    const suggestedTextModels = textModelIds
      .filter((model) =>
        /(^|\/)Qwen.*Qwen3/i.test(model),
      )
      .slice(0, 20);

    const suggestedVideoModels = videoModelIds
      .filter((model) =>
        /(Wan|LTX|Hunyuan|CogVideo)/i.test(model),
      )
      .slice(0, 20);

    return NextResponse.json(
      {
        ok: true,
        configured: true,
        authOk: true,
        authMode,
        tasksStatus: tasksProbe.status,
        textModelsStatus: textModelsResponse.status,
        videoModelsStatus: videoModelsResponse.status,
        textModelCount: textModelIds.length,
        videoModelCount: videoModelIds.length,
        modelAvailability,
        suggestedTextModels,
        suggestedVideoModels,
        note:
          catalogHealthy
            ? "This endpoint never returns the Bytez API key or full model catalog."
            : "Bytez authentication works, but its model catalog endpoint is currently unavailable; model availability is unknown.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        authOk: false,
        authMode: "none" satisfies AuthMode,
        error:
          error instanceof Error
            ? error.name
            : "BYTEZ_HEALTH_FAILED",
      },
      { status: 502 },
    );
  }
}
