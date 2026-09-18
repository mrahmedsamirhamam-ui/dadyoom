"use client";

import { Capacitor } from "@capacitor/core";
import { Badge } from "@capawesome/capacitor-badge";

export type DadyoomPresence =
  | "fresh"
  | "streak"
  | "reminder"
  | "messages";

export async function setDadyoomPresence(
  state: DadyoomPresence,
  count = 0,
) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const supported = await Badge.isSupported();

  if (!supported.isSupported) {
    return;
  }

  const permission = await Badge.checkPermissions();

  if (permission.display !== "granted") {
    await Badge.requestPermissions();
  }

  const safeCount = Math.max(
    state === "fresh" ? 0 : 1,
    Math.min(99, Math.floor(count)),
  );

  if (safeCount === 0) {
    await Badge.clear();
    return;
  }

  await Badge.set({ count: safeCount });
}
