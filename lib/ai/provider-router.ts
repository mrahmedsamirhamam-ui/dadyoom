import { jsonrepair } from "jsonrepair";


export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiProfile = "economy" | "quality";

export type AiRequest = {
  messages: AiMessage[];
  profile?: AiProfile;
  temperature?: number;
  maxTokens?: number;
  excludeProviders?: string[];
  preferredProviders?: string[];
};

export type AiResult = {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
};

type ProviderError = Error & { status?: number };

const DEFAULT_ECONOMY = [
  "bytez",
  "gemini",
  "deepseek",
  "openrouter",
  "anthropic",
  "groq",
  "mistral",
  "openai",
  "ollama",
];

const DEFAULT_QUALITY = [
  "anthropic",
  "gemini",
  "bytez",
  "deepseek",
  "openrouter",
  "groq",
  "mistral",
  "openai",
  "ollama",
];

function list(value: string | undefined): string[] {
  return String(value ?? "")
    .split(/[,\n;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectKeys(prefix: string): string[] {
  const output = new Set<string>();

  for (const item of list(process.env[`${prefix}_API_KEYS`])) {
    output.add(item);
  }

  for (const name of [
    `${prefix}_API_KEY`,
    `${prefix}_API_KEY_BACKUP`,
  ]) {
    const key = process.env[name]?.trim();
    if (key) output.add(key);
  }

  for (let index = 2; index <= 10; index += 1) {
    const key = process.env[`${prefix}_API_KEY_${index}`]?.trim();
    if (key) output.add(key);
  }

  return [...output];
}

function makeError(message: string, status?: number): ProviderError {
  const error = new Error(message) as ProviderError;
  error.status = status;
  return error;
}

async function fetchTimed(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const configured = Number(process.env.AI_TIMEOUT_MS ?? 45000);
  const timeout = Number.isFinite(configured)
    ? Math.max(5000, Math.min(180000, configured))
    : 45000;

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function openAiCompatible(params: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: AiMessage[];
  temperature: number;
  maxTokens: number;
  extraBody?: Record<string, unknown>;
  extraHeaders?: Record<string, string>;
}): Promise<string> {
  const response = await fetchTimed(
    `${params.baseUrl.replace(/\/+$/u, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
        ...(params.extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        stream: false,
        ...(params.extraBody ?? {}),
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw makeError(
      `HTTP_${response.status}:${detail.slice(0, 250)}`,
      response.status,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string }>;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => item.text ?? "")
      .join("\n")
      .trim();

    if (text) return text;
  }

  throw makeError("EMPTY_OPENAI_COMPAT_RESPONSE");
}


function bytezOutputText(output: unknown): string {
  if (typeof output === "string") {
    return output.trim();
  }

  if (Array.isArray(output)) {
    return output
      .map((item) => bytezOutputText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (!output || typeof output !== "object") {
    return "";
  }

  const record = output as Record<string, unknown>;

  for (const key of [
    "text",
    "generated_text",
    "content",
    "response",
    "answer",
  ]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const message = record.message;
  if (message && typeof message === "object") {
    const content = (message as Record<string, unknown>).content;
    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }
  }

  const choices = record.choices;
  if (Array.isArray(choices)) {
    const text = choices
      .map((choice) => bytezOutputText(choice))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
}

function bytezModelAllowed(model: string) {
  if (
    process.env.BYTEZ_ALLOW_PAID_MODELS?.trim().toLowerCase() ===
    "true"
  ) {
    return true;
  }

  const allowed = new Set([
    "Qwen/Qwen3-4B-Instruct-2507",
    ...list(process.env.BYTEZ_FREE_MODEL_ALLOWLIST),
  ]);

  return allowed.has(model);
}

async function callBytez(input: AiRequest): Promise<AiResult> {
  const apiKeys = collectKeys("BYTEZ");

  if (!apiKeys.length) {
    throw makeError("BYTEZ_NOT_CONFIGURED");
  }

  const configuredModels = list(
    process.env.BYTEZ_MODELS_PRIORITY,
  );

  const models = [
    ...new Set(
      (
        configuredModels.length
          ? configuredModels
          : [
              process.env.BYTEZ_MODEL?.trim(),
              "Qwen/Qwen3-4B-Instruct-2507",
            ]
      ).filter((value): value is string => Boolean(value)),
    ),
  ].filter(bytezModelAllowed);

  if (!models.length) {
    throw makeError("BYTEZ_NO_ALLOWED_MODEL");
  }

  const baseUrl =
    process.env.BYTEZ_BASE_URL?.trim() ||
    "https://api.bytez.com";

  let lastError: unknown = null;

  for (const model of models) {
    let modelError: unknown = null;

    for (const apiKey of apiKeys) {
      const started = Date.now();

      try {
        const modelPath = model
          .split("/")
          .map((part) => encodeURIComponent(part))
          .join("/");

        const inputMode =
          process.env.BYTEZ_INPUT_MODE?.trim().toLowerCase() ||
          (model === "Qwen/Qwen3-4B-Instruct-2507"
            ? "text"
            : "messages");

        const bytezInput =
          inputMode === "text"
            ? {
                text: input.messages
                  .map(
                    (item) =>
                      `${item.role.toUpperCase()}:\n${item.content}`,
                  )
                  .join("\n\n"),
              }
            : {
                messages:
                  input.messages,
              };

        const response = await fetchTimed(
          `${baseUrl.replace(/\/+$/u, "")}/models/v2/${modelPath}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: apiKey,
            },
            body: JSON.stringify({
              ...bytezInput,
              stream: false,
              params: {
                temperature: input.temperature ?? 0.3,
                max_new_tokens: input.maxTokens ?? 1200,
              },
            }),
          },
        );

        const raw = await response.text();

        if (!response.ok) {
          const error = makeError(
            `BYTEZ_${response.status}:${raw.slice(0, 250)}`,
            response.status,
          );
          lastError = error;
          modelError = error;

          if (response.status === 401 || response.status === 403) {
            continue;
          }

          break;
        }

        let payload: {
          error?: unknown;
          output?: unknown;
        };

        try {
          payload = JSON.parse(raw) as {
            error?: unknown;
            output?: unknown;
          };
        } catch {
          throw makeError("BYTEZ_INVALID_JSON");
        }

        if (payload.error) {
          throw makeError(
            `BYTEZ_ERROR:${String(payload.error).slice(0, 250)}`,
          );
        }

        const text = bytezOutputText(payload.output);

        if (!text) {
          throw makeError("BYTEZ_EMPTY");
        }

        return {
          text,
          provider: "bytez",
          model,
          latencyMs: Date.now() - started,
        };
      } catch (error) {
        lastError = error;
        modelError = error;
        const status = (error as ProviderError).status;

        if (status === 401 || status === 403) {
          continue;
        }

        break;
      }
    }

    const status = (modelError as ProviderError | null)?.status;

    if (
      status &&
      ![404, 408, 425, 429, 500, 502, 503, 504].includes(status)
    ) {
      break;
    }
  }

  throw lastError ?? makeError("BYTEZ_FAILED");
}

async function callOllama(input: AiRequest): Promise<AiResult> {
  const baseUrl =
    process.env.OLLAMA_BASE_URL?.trim() ||
    "http://127.0.0.1:11434/v1";

  const configuredModels = list(process.env.OLLAMA_MODELS_PRIORITY);
  const models = configuredModels.length
    ? configuredModels
    : ["qwen3:4b-instruct", "gpt-oss:20b"];

  let lastError: unknown = null;

  for (const model of models) {
    const started = Date.now();

    try {
      const text = await openAiCompatible({
        baseUrl,
        apiKey: "ollama",
        model,
        messages: input.messages,
        temperature: input.temperature ?? 0.3,
        maxTokens: input.maxTokens ?? 1200,
      });

      return {
        text,
        provider: "ollama",
        model,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      lastError = error;
      const status = (error as ProviderError).status;

      if (status && status !== 404) break;
    }
  }

  throw lastError ?? makeError("OLLAMA_UNAVAILABLE");
}

async function callGemini(input: AiRequest): Promise<AiResult> {
  const apiKeys = collectKeys("GEMINI");

  if (!apiKeys.length) {
    throw makeError("GEMINI_NOT_CONFIGURED");
  }

  const configuredPriority = list(
    process.env.GEMINI_MODELS_PRIORITY,
  );

  const models = [
    ...new Set(
      (
        configuredPriority.length
          ? configuredPriority
          : [
              process.env.GEMINI_MODEL?.trim(),
              "gemini-3.8-flash",
              process.env.GEMINI_MODEL_BACKUP?.trim(),
              "gemini-3.7-flash",
              "gemini-3.6-flash",
            ]
      ).filter((value): value is string => Boolean(value)),
    ),
  ];

  const prompt = input.messages
    .map((item) => `${item.role.toUpperCase()}:\n${item.content}`)
    .join("\n\n");

  let lastError: unknown = null;

  for (const model of models) {
    let modelError: unknown = null;

    for (const apiKey of apiKeys) {
      const started = Date.now();

      try {
        const response = await fetchTimed(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
            model,
          )}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: input.temperature ?? 0.3,
                maxOutputTokens: input.maxTokens ?? 1200,
              },
            }),
          },
        );

        if (!response.ok) {
          const detail = await response.text();
          const error = makeError(
            `GEMINI_${response.status}:${detail.slice(0, 250)}`,
            response.status,
          );

          lastError = error;
          modelError = error;

          if (response.status === 401 || response.status === 403) {
            continue;
          }

          break;
        }

        const payload = (await response.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };

        const text =
          payload.candidates?.[0]?.content?.parts
            ?.map((item) => item.text ?? "")
            .join("\n")
            .trim() ?? "";

        if (!text) {
          const error = makeError("GEMINI_EMPTY");
          lastError = error;
          modelError = error;
          break;
        }

        return {
          text,
          provider: "gemini",
          model,
          latencyMs: Date.now() - started,
        };
      } catch (error) {
        lastError = error;
        modelError = error;

        const status = (error as ProviderError).status;

        if (status === 401 || status === 403) {
          continue;
        }

        break;
      }
    }

    const status = (modelError as ProviderError | null)?.status;

    if (
      status &&
      ![404, 408, 425, 429, 500, 502, 503, 504].includes(status)
    ) {
      break;
    }
  }

  throw lastError ?? makeError("GEMINI_FAILED");
}

async function callAnthropic(input: AiRequest): Promise<AiResult> {
  const apiKeys = collectKeys("ANTHROPIC");

  if (!apiKeys.length) {
    throw makeError("ANTHROPIC_NOT_CONFIGURED");
  }

  const model =
    process.env.ANTHROPIC_MODEL?.trim() ||
    "claude-haiku-4-5-20251001";

  const system = input.messages
    .filter((item) => item.role === "system")
    .map((item) => item.content)
    .join("\n\n");

  const messages = input.messages
    .filter((item) => item.role !== "system")
    .map((item) => ({
      role: item.role,
      content: item.content,
    }));

  let lastError: unknown = null;

  for (const apiKey of apiKeys) {
    const started = Date.now();

    try {
      const response = await fetchTimed(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: input.maxTokens ?? 1200,
            temperature: input.temperature ?? 0.3,
            system: system || undefined,
            messages,
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text();
        const error = makeError(
          `ANTHROPIC_${response.status}:${detail.slice(0, 250)}`,
          response.status,
        );

        if (response.status === 401 || response.status === 403) {
          lastError = error;
          continue;
        }

        throw error;
      }

      const payload = (await response.json()) as {
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      };

      const text =
        payload.content
          ?.filter((item) => item.type === "text")
          .map((item) => item.text ?? "")
          .join("\n")
          .trim() ?? "";

      if (!text) throw makeError("ANTHROPIC_EMPTY");

      return {
        text,
        provider: "anthropic",
        model,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      lastError = error;
      const status = (error as ProviderError).status;

      if (status && status !== 401 && status !== 403) break;
    }
  }

  throw lastError ?? makeError("ANTHROPIC_FAILED");
}

async function callGeneric(
  input: AiRequest,
  config: {
    provider: string;
    prefix: string;
    baseUrl: string;
    modelEnv: string;
    defaultModel?: string;
    openRouter?: boolean;
  },
): Promise<AiResult> {
  const apiKeys = collectKeys(config.prefix);

  if (!apiKeys.length) {
    throw makeError(`${config.prefix}_NOT_CONFIGURED`);
  }

  const openRouterModels =
    config.openRouter
      ? list(process.env.OPENROUTER_MODELS)
      : [];

  const model =
    openRouterModels[0] ||
    process.env[config.modelEnv]?.trim() ||
    config.defaultModel ||
    "";

  if (!model) {
    throw makeError(`${config.modelEnv}_NOT_CONFIGURED`);
  }

  let lastError: unknown = null;

  for (const apiKey of apiKeys) {
    const started = Date.now();

    try {
      const text = await openAiCompatible({
        baseUrl: config.baseUrl,
        apiKey,
        model,
        messages: input.messages,
        temperature: input.temperature ?? 0.3,
        maxTokens: input.maxTokens ?? 1200,
        extraBody:
          config.openRouter
            ? {
                ...(openRouterModels.length > 1
                  ? { models: openRouterModels.slice(1) }
                  : {}),
                provider: {
                  allow_fallbacks: true,
                  sort:
                    input.profile === "quality"
                      ? "throughput"
                      : "price",
                },
              }
            : undefined,
        extraHeaders:
          config.openRouter
            ? {
                "HTTP-Referer":
                  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
                  "http://localhost:3000",
                "X-OpenRouter-Title": "Dadyoom",
              }
            : undefined,
      });

      return {
        text,
        provider: config.provider,
        model:
          config.openRouter && openRouterModels.length > 1
            ? openRouterModels.join(" -> ")
            : model,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      lastError = error;
      const status = (error as ProviderError).status;

      if (status === 401 || status === 403) continue;
      break;
    }
  }

  throw lastError ?? makeError(`${config.prefix}_FAILED`);
}

function providerOrder(profile: AiProfile): string[] {
  const variable =
    profile === "quality"
      ? "AI_QUALITY_PROVIDER_ORDER"
      : "AI_PROVIDER_ORDER";

  const configured = list(process.env[variable]);

  return configured.length
    ? configured
    : profile === "quality"
      ? DEFAULT_QUALITY
      : DEFAULT_ECONOMY;
}

async function callProvider(
  provider: string,
  input: AiRequest,
): Promise<AiResult> {
  if (provider === "ollama") return callOllama(input);
  if (provider === "bytez") return callBytez(input);
  if (provider === "gemini") return callGemini(input);
  if (provider === "anthropic") return callAnthropic(input);

  if (provider === "deepseek") {
    return callGeneric(input, {
      provider: "deepseek",
      prefix: "DEEPSEEK",
      baseUrl: "https://api.deepseek.com",
      modelEnv: "DEEPSEEK_MODEL",
      defaultModel: "deepseek-v4-flash",
    });
  }

  if (provider === "openrouter") {
    return callGeneric(input, {
      provider: "openrouter",
      prefix: "OPENROUTER",
      baseUrl: "https://openrouter.ai/api/v1",
      modelEnv: "OPENROUTER_MODEL",
      defaultModel: "openrouter/auto",
      openRouter: true,
    });
  }

  if (provider === "groq") {
    return callGeneric(input, {
      provider: "groq",
      prefix: "GROQ",
      baseUrl: "https://api.groq.com/openai/v1",
      modelEnv: "GROQ_MODEL",
    });
  }

  if (provider === "mistral") {
    return callGeneric(input, {
      provider: "mistral",
      prefix: "MISTRAL",
      baseUrl: "https://api.mistral.ai/v1",
      modelEnv: "MISTRAL_MODEL",
      defaultModel: "mistral-small-latest",
    });
  }

  if (provider === "openai") {
    return callGeneric(input, {
      provider: "openai",
      prefix: "OPENAI",
      baseUrl: "https://api.openai.com/v1",
      modelEnv: "OPENAI_MODEL",
    });
  }

  throw makeError(`UNKNOWN_PROVIDER:${provider}`);
}

export async function routeAi(input: AiRequest): Promise<AiResult> {
  const profile = input.profile ?? "economy";
  const excluded = new Set(input.excludeProviders ?? []);
  const failures: string[] = [];

  const order =
    input.preferredProviders?.length
      ? input.preferredProviders
      : providerOrder(profile);

  for (const provider of order) {
    if (excluded.has(provider)) continue;

    try {
      return await callProvider(provider, {
        ...input,
        profile,
      });
    } catch (error) {
      const providerError =
        error as ProviderError;
      const message =
        error instanceof Error
          ? error.message
          : "unknown";

      failures.push(
        `${provider}:${message}`,
      );

      console.warn(
        "AI_PROVIDER_FAILED",
        {
          provider,
          status:
            providerError.status ??
            null,
          reason:
            message.split(":")[0],
        },
      );
    }
  }

  console.error("AI_ALL_PROVIDERS_FAILED", {
    profile,
    providers: order.filter((provider) => !excluded.has(provider)),
    failures: failures.slice(0, 12),
  });

  // Never expose provider names, configuration state, API errors,
  // model names, or upstream response bodies to the learner.
  throw makeError("DAD_AI_TEMPORARILY_UNAVAILABLE", 503);
}

export function stripThinking(value: string): string {
  return value
    .replace(/<think>[\s\S]*?<\/think>/giu, "")
    .replace(/```(?:json)?/giu, "")
    .trim();
}

export function parseJsonText<T>(value: string): T {
  const clean = stripThinking(value);
  const objectStart = clean.indexOf("{");
  const arrayStart = clean.indexOf("[");
  const starts = [objectStart, arrayStart].filter(
    (index) => index >= 0,
  );
  const start = starts.length ? Math.min(...starts) : 0;

  const objectEnd = clean.lastIndexOf("}");
  const arrayEnd = clean.lastIndexOf("]");
  const end = Math.max(objectEnd, arrayEnd);

  const candidate =
    end >= start
      ? clean.slice(start, end + 1)
      : clean.slice(start);

  try {
    return JSON.parse(candidate) as T;
  } catch (firstError) {
    try {
      return JSON.parse(jsonrepair(candidate)) as T;
    } catch (repairError) {
      const first =
        firstError instanceof Error
          ? firstError.message
          : "JSON_PARSE_FAILED";
      const second =
        repairError instanceof Error
          ? repairError.message
          : "JSON_REPAIR_FAILED";

      throw new Error(
        `AI_JSON_INVALID:${first} | REPAIR:${second}`,
      );
    }
  }
}

export async function routeAiJson<T>(input: AiRequest) {
  const result = await routeAi(input);

  return {
    ...result,
    data: parseJsonText<T>(result.text),
  };
}

export function aiConfigSummary() {
  return {
    economyOrder: providerOrder("economy"),
    qualityOrder: providerOrder("quality"),
    localModels:
      list(process.env.OLLAMA_MODELS_PRIORITY).length
        ? list(process.env.OLLAMA_MODELS_PRIORITY)
        : ["qwen3:4b-instruct", "gpt-oss:20b"],
    keyCounts: {
      bytez: collectKeys("BYTEZ").length,
      gemini: collectKeys("GEMINI").length,
      anthropic: collectKeys("ANTHROPIC").length,
      deepseek: collectKeys("DEEPSEEK").length,
      openrouter: collectKeys("OPENROUTER").length,
      groq: collectKeys("GROQ").length,
      mistral: collectKeys("MISTRAL").length,
      openai: collectKeys("OPENAI").length,
    },
  };
}
