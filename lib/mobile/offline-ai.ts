"use client";

import { Capacitor } from "@capacitor/core";
import { CapgoLLM } from "@capgo/capacitor-llm";

const MODEL_FILE = "dadyoom-offline.litertlm";

function modelPath() {
  const platform = Capacitor.getPlatform();

  if (platform === "android") {
    return `/android_asset/public/models/${MODEL_FILE}`;
  }

  if (platform === "ios") {
    return `public/models/${MODEL_FILE}`;
  }

  return `/models/${MODEL_FILE}`;
}

async function waitForReady(timeoutMs = 25000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const { readiness } = await CapgoLLM.getReadiness();
    const normalized = String(readiness).toLowerCase();

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
      throw new Error(`OFFLINE_AI_${readiness}`);
    }

    await new Promise((resolve) =>
      window.setTimeout(resolve, 250),
    );
  }

  throw new Error("OFFLINE_AI_READY_TIMEOUT");
}

export async function initializeOfflineAI() {
  if (!Capacitor.isNativePlatform()) {
    return {
      ready: false,
      readiness: "native-app-required",
    };
  }

  await CapgoLLM.setModel({
    path: modelPath(),
    modelType: "litertlm",
    maxTokens: 512,
    topk: 24,
    temperature: 0.35,
    backend: "cpu",
  });

  const readiness = await waitForReady();

  return {
    ready: true,
    readiness,
  };
}

export async function askOfflineAI(message: string) {
  await initializeOfflineAI();

  const { id } = await CapgoLLM.createChat();

  let output = "";

  const textListener = await CapgoLLM.addListener(
    "textFromAi",
    (event) => {
      if (event.chatId === id) {
        output += event.text;
      }
    },
  );

  let finishResolve: (() => void) | null = null;

  const finished = new Promise<void>((resolve) => {
    finishResolve = resolve;
  });

  const finishListener = await CapgoLLM.addListener(
    "aiFinished",
    (event) => {
      if (event.chatId === id) {
        finishResolve?.();
      }
    },
  );

  try {
    await CapgoLLM.sendMessage({
      chatId: id,
      message: [
        "أنت ضاد المحلي، مساعد خفيف يعمل داخل الهاتف.",
        "أجب بالعربية بإيجاز.",
        "لا تخترع حقائق دراسية.",
        "إذا احتاج السؤال شرحًا أكاديميًا دقيقًا قل: استخدم ضاد السحابي.",
        "",
        message.trim(),
      ].join("\n"),
    });

    await Promise.race([
      finished,
      new Promise<void>((_, reject) => {
        window.setTimeout(
          () => reject(
            new Error("OFFLINE_AI_GENERATION_TIMEOUT"),
          ),
          30000,
        );
      }),
    ]);

    return output.trim();
  } finally {
    await Promise.all([
      textListener.remove(),
      finishListener.remove(),
    ]);
  }
}
