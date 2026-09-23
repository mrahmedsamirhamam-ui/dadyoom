"use client";

import { Capacitor } from "@capacitor/core";
import { CapgoLLM } from "@capgo/capacitor-llm";

const MODEL_FILENAME =
  "dadyoom-qwen2.5-0.5b-instruct-q8.task";

const MODEL_URL =
  "https://huggingface.co/litert-community/Qwen2.5-0.5B-Instruct/resolve/main/Qwen2.5-0.5B-Instruct_multi-prefill-seq_q8_ekv1280.task?download=true";

const MODEL_PATH_KEY =
  "dadyoom-offline-ai-model-path-v3";

let activeModelPath: string | null = null;
let initializePromise:
  | Promise<{
      ready: boolean;
      readiness: string;
      path?: string;
    }>
  | null = null;

export function getOfflineAIModelInfo() {
  return {
    name: "Qwen2.5-0.5B-Instruct Q8",
    filename: MODEL_FILENAME,
    approximateSizeMb: 547,
  };
}

export function hasOfflineAIModel() {
  if (
    typeof window === "undefined" ||
    !Capacitor.isNativePlatform()
  ) {
    return false;
  }

  return Boolean(
    window.localStorage.getItem(
      MODEL_PATH_KEY,
    ),
  );
}

async function downloadOfflineModel(
  onProgress?: (progress: number) => void,
) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "OFFLINE_AI_NATIVE_APP_REQUIRED",
    );
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.onLine === false
  ) {
    throw new Error(
      "OFFLINE_AI_MODEL_NOT_INSTALLED_CONNECT_ONCE",
    );
  }

  const progressListener =
    await CapgoLLM.addListener(
      "downloadProgress",
      (event) => {
        const value = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              Number(event.progress) || 0,
            ),
          ),
        );

        onProgress?.(value);
      },
    );

  try {
    const result =
      await CapgoLLM.downloadModel({
        url: MODEL_URL,
        filename: MODEL_FILENAME,
      });

    const path = result.path?.trim();

    if (!path) {
      throw new Error(
        "OFFLINE_AI_DOWNLOAD_PATH_MISSING",
      );
    }

    window.localStorage.setItem(
      MODEL_PATH_KEY,
      path,
    );

    return path;
  } finally {
    await progressListener.remove();
  }
}

export async function installOfflineAIModel(
  onProgress?: (progress: number) => void,
) {
  if (!Capacitor.isNativePlatform()) {
    return {
      installed: false,
      native: false,
      path: "",
    };
  }

  const cached =
    window.localStorage.getItem(
      MODEL_PATH_KEY,
    )?.trim();

  if (cached) {
    onProgress?.(100);

    return {
      installed: true,
      native: true,
      path: cached,
    };
  }

  const path =
    await downloadOfflineModel(
      onProgress,
    );

  return {
    installed: true,
    native: true,
    path,
  };
}

async function waitForReady(
  timeoutMs = 30000,
) {
  const started = Date.now();

  while (
    Date.now() - started <
    timeoutMs
  ) {
    const { readiness } =
      await CapgoLLM.getReadiness();

    const normalized =
      String(readiness).toLowerCase();

    if (
      normalized.includes("ready") ||
      normalized.includes("available")
    ) {
      return readiness;
    }

    if (
      normalized.includes("error") ||
      normalized.includes("unavailable")
    ) {
      throw new Error(
        `OFFLINE_AI_${readiness}`,
      );
    }

    await new Promise((resolve) =>
      window.setTimeout(
        resolve,
        300,
      ),
    );
  }

  throw new Error(
    "OFFLINE_AI_READY_TIMEOUT",
  );
}

async function configureModel(
  path: string,
) {
  await CapgoLLM.setModel({
    path,
    modelType: "task",
    maxTokens: 512,
    topk: 24,
    temperature: 0.35,
    backend: "cpu",
  });

  const readiness =
    await waitForReady();

  activeModelPath = path;

  return {
    ready: true,
    readiness,
    path,
  };
}

async function initializeInternal(
  onProgress?: (progress: number) => void,
) {
  if (!Capacitor.isNativePlatform()) {
    return {
      ready: false,
      readiness:
        "native-app-required",
    };
  }

  if (activeModelPath) {
    const { readiness } =
      await CapgoLLM.getReadiness();

    const normalized =
      String(readiness).toLowerCase();

    if (
      normalized.includes("ready") ||
      normalized.includes("available")
    ) {
      return {
        ready: true,
        readiness,
        path: activeModelPath,
      };
    }
  }

  let path =
    window.localStorage.getItem(
      MODEL_PATH_KEY,
    )?.trim();

  if (!path) {
    if (
      typeof navigator !== "undefined" &&
      navigator.onLine === false
    ) {
      throw new Error(
        "OFFLINE_AI_MODEL_NOT_INSTALLED_CONNECT_ONCE",
      );
    }

    path =
      await downloadOfflineModel(
        onProgress,
      );
  }

  try {
    return await configureModel(
      path,
    );
  } catch (firstError) {
    const online =
      typeof navigator === "undefined" ||
      navigator.onLine !== false;

    if (!online) {
      throw firstError;
    }

    window.localStorage.removeItem(
      MODEL_PATH_KEY,
    );

    path =
      await downloadOfflineModel(
        onProgress,
      );

    return configureModel(path);
  }
}

export async function initializeOfflineAI(
  onProgress?: (progress: number) => void,
) {
  if (!initializePromise) {
    initializePromise =
      initializeInternal(
        onProgress,
      ).catch((error) => {
        initializePromise = null;
        throw error;
      });
  }

  return initializePromise;
}

export async function askOfflineAI(
  message: string,
) {
  await initializeOfflineAI();

  const { id } =
    await CapgoLLM.createChat();

  let output = "";

  const textListener =
    await CapgoLLM.addListener(
      "textFromAi",
      (event) => {
        if (event.chatId === id) {
          output += event.text;
        }
      },
    );

  let finishResolve:
    | (() => void)
    | null = null;

  let finishReject:
    | ((error: Error) => void)
    | null = null;

  const finished =
    new Promise<void>(
      (resolve, reject) => {
        finishResolve = resolve;
        finishReject = reject;
      },
    );

  const finishListener =
    await CapgoLLM.addListener(
      "aiFinished",
      (event) => {
        if (event.chatId === id) {
          finishResolve?.();
        }
      },
    );

  const errorListener =
    await CapgoLLM.addListener(
      "generationError",
      (event) => {
        if (
          !event.chatId ||
          event.chatId === id
        ) {
          finishReject?.(
            new Error(
              event.error ||
                "OFFLINE_AI_GENERATION_ERROR",
            ),
          );
        }
      },
    );

  try {
    await CapgoLLM.sendMessage({
      chatId: id,
      message: [
        "أنت ضاد المحلي، مساعد عربي خفيف يعمل داخل الهاتف بدون اتصال بالشبكة.",
        "أجب بالعربية الفصحى الواضحة وباختصار.",
        "لا تخترع حقائق دراسية أو مراجع.",
        "استخدم سياق الدرس الموجود في السؤال إذا توفر.",
        "إذا كان السؤال يحتاج معلومات حديثة من الإنترنت فقل بوضوح إن الاتصال مطلوب.",
        "",
        message.trim(),
      ].join("\n"),
    });

    await Promise.race([
      finished,
      new Promise<void>(
        (_, reject) => {
          window.setTimeout(
            () =>
              reject(
                new Error(
                  "OFFLINE_AI_GENERATION_TIMEOUT",
                ),
              ),
            45000,
          );
        },
      ),
    ]);

    return output.trim();
  } finally {
    await Promise.all([
      textListener.remove(),
      finishListener.remove(),
      errorListener.remove(),
    ]);
  }
}
