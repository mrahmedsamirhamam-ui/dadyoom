"use client";

import { Capacitor } from "@capacitor/core";
import { CapgoLLM } from "@capgo/capacitor-llm";

const MODEL_FILENAME =
  "dadyoom-qwen2.5-0.5b-instruct-q8.task";

const ANDROID_BUNDLED_MODEL_PATH =
  `/android_asset/${MODEL_FILENAME}`;

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
    bundled: true,
  };
}

export function hasOfflineAIModel() {
  if (
    typeof window === "undefined" ||
    !Capacitor.isNativePlatform()
  ) {
    return false;
  }

  return Capacitor.getPlatform() === "android";
}

async function waitForReady(
  timeoutMs = 45000,
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
        350,
      ),
    );
  }

  throw new Error(
    "OFFLINE_AI_READY_TIMEOUT",
  );
}

async function configureBundledAndroidModel() {
  await CapgoLLM.setModel({
    path: ANDROID_BUNDLED_MODEL_PATH,
    modelType: "task",
    maxTokens: 512,
    topk: 24,
    temperature: 0.35,
    backend: "cpu",
  });

  const readiness =
    await waitForReady();

  activeModelPath =
    ANDROID_BUNDLED_MODEL_PATH;

  return {
    ready: true,
    readiness,
    path: ANDROID_BUNDLED_MODEL_PATH,
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

  if (
    Capacitor.getPlatform() !==
    "android"
  ) {
    throw new Error(
      "OFFLINE_AI_IOS_BUNDLE_PENDING_XCODE",
    );
  }

  onProgress?.(100);

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

  return configureBundledAndroidModel();
}

export async function installOfflineAIModel(
  onProgress?: (progress: number) => void,
) {
  const result =
    await initializeOfflineAI(
      onProgress,
    );

  return {
    installed: result.ready,
    native:
      Capacitor.isNativePlatform(),
    bundled: true,
    path: result.path ?? "",
  };
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
            60000,
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
