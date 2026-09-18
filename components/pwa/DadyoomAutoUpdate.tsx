"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VersionPayload = {
  version?: string;
  builtAt?: string;
};

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

async function fetchServerVersion() {
  const response = await fetch(
    `/app-version.json?ts=${Date.now()}`,
    {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    },
  );

  if (!response.ok) {
    throw new Error("VERSION_CHECK_FAILED");
  }

  return (await response.json()) as VersionPayload;
}

export default function DadyoomAutoUpdate() {
  const currentVersionRef = useRef<string | null>(null);
  const updatingRef = useRef(false);
  const [updating, setUpdating] = useState(false);

  const applyUpdate = useCallback(async (newVersion: string) => {
    if (updatingRef.current) return;

    updatingRef.current = true;
    setUpdating(true);

    try {
      if ("serviceWorker" in navigator) {
        const registrations =
          await navigator.serviceWorker.getRegistrations();

        await Promise.all(
          registrations.map(async (registration) => {
            try {
              await registration.update();

              if (registration.waiting) {
                registration.waiting.postMessage({
                  type: "SKIP_WAITING",
                });
              }
            } catch {
              // Version reload below still refreshes the web app.
            }
          }),
        );
      }

      sessionStorage.setItem(
        "dadyoom:last-version",
        newVersion,
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch {
      window.location.reload();
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (updatingRef.current) return;

    try {
      const payload = await fetchServerVersion();
      const serverVersion = payload.version?.trim();

      if (!serverVersion) return;

      if (!currentVersionRef.current) {
        currentVersionRef.current = serverVersion;
        sessionStorage.setItem(
          "dadyoom:last-version",
          serverVersion,
        );
        return;
      }

      if (serverVersion !== currentVersionRef.current) {
        await applyUpdate(serverVersion);
      }
    } catch {
      // Never break the app if a version check temporarily fails.
    }
  }, [applyUpdate]);

  useEffect(() => {
    void checkForUpdate();

    const interval = window.setInterval(
      () => void checkForUpdate(),
      CHECK_INTERVAL_MS,
    );

    const onFocus = () => {
      void checkForUpdate();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener(
      "visibilitychange",
      onVisibility,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener(
        "visibilitychange",
        onVisibility,
      );
    };
  }, [checkForUpdate]);

  if (!updating) return null;

  return (
    <div
      dir="rtl"
      className="fixed inset-x-3 bottom-3 z-[200] mx-auto max-w-md rounded-2xl border border-[#d7bd78] bg-[#123f39] px-4 py-3 text-center text-sm font-black text-white shadow-2xl"
      role="status"
      aria-live="polite"
    >
      تم العثور على تحديث جديد لضاديوم — جارٍ التحديث تلقائيًا…
    </div>
  );
}
