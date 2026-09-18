"use client";

import { Capacitor } from "@capacitor/core";

import { askOfflineAI } from "@/lib/mobile/offline-ai";

export type HybridAIEngine = "cloud" | "local";

export type HybridAIResult = {
  text: string;
  engine: HybridAIEngine;
  reason:
    | "cloud-ok"
    | "offline-device"
    | "cloud-unavailable"
    | "cloud-limit";
};

export type HybridAIContext = Record<string, unknown>;

export type HybridAIOptions = {
  signal?: AbortSignal;
};

type CloudReply = {
  reply?: string;
  error?: string;
};

const FALLBACK_STATUSES = new Set([
  0,
  401,
  403,
  408,
  409,
  425,
  429,
  500,
  502,
  503,
  504,
]);

function localPrompt(
  message: string,
  context: HybridAIContext,
): string {
  const parts: string[] = [];

  const pageTitle =
    typeof context.pageTitle === "string"
      ? context.pageTitle.trim()
      : "";

  const lessonTitle =
    typeof context.lessonTitle === "string"
      ? context.lessonTitle.trim()
      : "";

  const lessonContent =
    typeof context.lessonContent === "string"
      ? context.lessonContent.trim()
      : "";

  const studentLevel =
    typeof context.studentLevel === "string"
      ? context.studentLevel.trim()
      : "";

  if (pageTitle) {
    parts.push(`الصفحة: ${pageTitle}`);
  }

  if (lessonTitle) {
    parts.push(`الدرس: ${lessonTitle}`);
  }

  if (studentLevel) {
    parts.push(`المستوى: ${studentLevel}`);
  }

  if (lessonContent) {
    parts.push(
      `محتوى الدرس:\n${lessonContent.slice(0, 6000)}`,
    );
  }

  if (!parts.length) {
    return message;
  }

  return [
    message,
    "",
    "سياق ضاديوم:",
    ...parts,
  ].join("\n");
}

async function askCloud(
  message: string,
  context: HybridAIContext = {},
  externalSignal?: AbortSignal,
) {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromExternal = () => {
    if (!controller.signal.aborted) {
      controller.abort(
        externalSignal?.reason ?? "DADYOOM_REQUEST_ABORTED",
      );
    }
  };

  if (externalSignal?.aborted) {
    abortFromExternal();
  } else {
    externalSignal?.addEventListener(
      "abort",
      abortFromExternal,
      { once: true },
    );
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true;

    if (!controller.signal.aborted) {
      controller.abort("DADYOOM_CLOUD_TIMEOUT");
    }
  }, 60000);

  try {
    const response = await fetch("/api/dad/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...context,
        message,
        pageTitle:
          typeof context.pageTitle === "string"
            ? context.pageTitle
            : document.title || "ضاديوم",
        pageContext:
          typeof context.pageContext === "string"
            ? context.pageContext
            : window.location.pathname,
        mode:
          typeof context.mode === "string"
            ? context.mode
            : "chat",
      }),
      signal: controller.signal,
    });

    let data: CloudReply = {};

    try {
      data = (await response.json()) as CloudReply;
    } catch {
      // Use the safe message below.
    }

    const reply = data.reply?.trim();

    if (response.ok && reply) {
      return {
        ok: true as const,
        text: reply,
        status: response.status,
      };
    }

    return {
      ok: false as const,
      status: response.status,
      error:
        data.error ||
        "تعذر الحصول على رد من ضاد الآن. حاول مرة أخرى.",
    };
  } catch (cause) {
    if (externalSignal?.aborted && !timedOut) {
      throw cause;
    }

    return {
      ok: false as const,
      status: timedOut ? 408 : 0,
      error: timedOut
        ? "استغرق الرد وقتًا أطول من المتوقع. حاول مرة أخرى بعد لحظات."
        : cause instanceof Error
          ? cause.message
          : "تعذر الاتصال بضاد الآن.",
    };
  } finally {
    window.clearTimeout(timeoutId);

    externalSignal?.removeEventListener(
      "abort",
      abortFromExternal,
    );
  }
}

export async function askDadyoomHybrid(
  message: string,
  context: HybridAIContext = {},
  options: HybridAIOptions = {},
): Promise<HybridAIResult> {
  const clean = message.trim();

  if (!clean) {
    throw new Error("اكتب سؤالك أولًا.");
  }

  if (options.signal?.aborted) {
    throw new DOMException(
      "DADYOOM_REQUEST_ABORTED",
      "AbortError",
    );
  }

  const native = Capacitor.isNativePlatform();
  const online =
    typeof navigator === "undefined" ||
    navigator.onLine !== false;

  if (online) {
    const cloud = await askCloud(
      clean,
      context,
      options.signal,
    );

    if (cloud.ok) {
      return {
        text: cloud.text,
        engine: "cloud",
        reason: "cloud-ok",
      };
    }

    if (
      !native ||
      !FALLBACK_STATUSES.has(cloud.status)
    ) {
      throw new Error(cloud.error);
    }

    const local = await askOfflineAI(
      localPrompt(clean, context),
    );
    const localText = local.trim();

    if (!localText) {
      throw new Error(cloud.error);
    }

    return {
      text: localText,
      engine: "local",
      reason:
        cloud.status === 429
          ? "cloud-limit"
          : "cloud-unavailable",
    };
  }

  if (!native) {
    throw new Error("لا يوجد اتصال بالإنترنت.");
  }

  const local = await askOfflineAI(
    localPrompt(clean, context),
  );
  const localText = local.trim();

  if (!localText) {
    throw new Error("تعذر تشغيل ضاد الآن.");
  }

  return {
    text: localText,
    engine: "local",
    reason: "offline-device",
  };
}
