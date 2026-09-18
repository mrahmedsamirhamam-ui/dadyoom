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
  "ollama",
  "gemini",
  "deepseek",
  "openrouter",
  "anthropic",
  "groq",
  "mistral",
  "openai",
];

const DEFAULT_QUALITY = [
  "anthropic",
  "gemini",
  "deepseek",
  "openrouter",
  "ollama",
  "groq",
  "mistral",
  "openai",
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

  const model =
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GEMINI_MODEL_BACKUP?.trim() ||
    "gemini-2.5-flash";

  const prompt = input.messages
    .map((item) => `${item.role.toUpperCase()}:\n${item.content}`)
    .join("\n\n");

  let lastError: unknown = null;

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

        if (response.status === 401 || response.status === 403) {
          lastError = error;
          continue;
        }

        throw error;
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

      if (!text) throw makeError("GEMINI_EMPTY");

      return {
        text,
        provider: "gemini",
        model,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      lastError = error;
      const status = (error as ProviderError).status;

      // Multiple keys are authorized auth/key failover.
      // On 429/5xx we move to a different provider instead of
      // cycling keys to bypass a provider quota.
      if (status && status !== 401 && status !== 403) break;
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
      failures.push(
        `${provider}:${
          error instanceof Error
            ? error.message
            : "unknown"
        }`,
      );
    }
  }

  throw new Error(
    `AI_ALL_PROVIDERS_FAILED:${failures.join(" | ").slice(0, 1800)}`,
  );
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
