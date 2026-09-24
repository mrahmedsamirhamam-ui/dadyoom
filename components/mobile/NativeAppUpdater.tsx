"use client";

import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import {
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type UpdateInfo = {
  ok?: boolean;
  version?: string;
  tag?: string;
  name?: string;
  publishedAt?: string | null;
  downloadUrl?: string;
  sizeBytes?: number;
  releaseUrl?: string | null;
  error?: string;
};

type UpdateState =
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "error";

function versionParts(value: string): number[] {
  return value
    .trim()
    .replace(/^v/iu, "")
    .split(".")
    .map((part) => {
      const match = part.match(/^\d+/u);
      return match ? Number(match[0]) : 0;
    });
}

function isNewerVersion(
  latest: string,
  current: string,
): boolean {
  const a = versionParts(latest);
  const b = versionParts(current);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;

    if (left > right) return true;
    if (left < right) return false;
  }

  return false;
}

function readableSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  const gb = bytes / 1024 / 1024 / 1024;

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }

  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

function subscribe() {
  return () => {};
}

function getNativeAndroidSnapshot() {
  return (
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

function getServerSnapshot() {
  return false;
}

export default function NativeAppUpdater() {
  const nativeAndroid =
    useSyncExternalStore(
      subscribe,
      getNativeAndroidSnapshot,
      getServerSnapshot,
    );

  const [open, setOpen] = useState(false);
  const [state, setState] =
    useState<UpdateState>("idle");
  const [currentVersion, setCurrentVersion] =
    useState("");
  const [latest, setLatest] =
    useState<UpdateInfo | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!nativeAndroid) {
      return;
    }

    void App.getInfo()
      .then((info) => {
        setCurrentVersion(
          String(info.version || "").trim(),
        );
      })
      .catch(() => {
        setCurrentVersion("");
      });
  }, [nativeAndroid]);

  if (!nativeAndroid) {
    return null;
  }

  async function checkForUpdate() {
    setOpen(true);
    setState("checking");
    setMessage("");
    setLatest(null);

    try {
      const info =
        await App.getInfo();
      const installed =
        String(info.version || "").trim();

      setCurrentVersion(installed);

      const response = await fetch(
        "/api/mobile/android/latest",
        {
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as UpdateInfo;

      if (
        !response.ok ||
        data.ok !== true ||
        !data.version
      ) {
        throw new Error(
          data.error ||
            "تعذر فحص التحديثات.",
        );
      }

      setLatest(data);

      if (
        installed &&
        isNewerVersion(
          data.version,
          installed,
        )
      ) {
        setState("available");
        setMessage(
          `يوجد تحديث جديد: ${data.version}`,
        );
        return;
      }

      setState("current");
      setMessage(
        installed
          ? `أنت تستخدم أحدث نسخة Native (${installed}).`
          : "أنت تستخدم أحدث نسخة Native.",
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر فحص التحديثات.",
      );
    }
  }

  async function downloadUpdate() {
    const url = latest?.downloadUrl;

    if (!url) {
      setState("error");
      setMessage(
        "رابط التحديث غير متاح حاليًا.",
      );
      return;
    }

    try {
      await Browser.open({
        url,
      });

      setMessage(
        "بدأ تنزيل APK الموقّع. بعد اكتمال التنزيل افتحه واضغط «تحديث». ستظل بيانات التطبيق محفوظة لأن التحديث يستخدم نفس توقيع ضاديوم.",
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر فتح رابط التحديث.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void checkForUpdate()
        }
        className="fixed left-3 top-[max(12px,env(safe-area-inset-top))] z-[10020] rounded-full border border-[#d2bd83] bg-[#fffaf0]/95 px-3 py-2 text-xs font-black text-[#123f39] shadow-lg backdrop-blur"
        aria-label="تحديث التطبيق"
        title="تحديث التطبيق"
      >
        ↻ تحديث
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[10030] grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="تحديث تطبيق ضاديوم"
        >
          <section
            dir="rtl"
            className="w-full max-w-md rounded-[2rem] border border-[#d8c493] bg-[#fffdf8] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-[#9b6b20]">
                  Dadyoom Native
                </p>
                <h2 className="mt-1 text-xl font-black text-[#123f39]">
                  تحديث التطبيق
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#ded1b7] bg-white text-lg font-black text-[#5d5140]"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-[#f3ead8] p-4 text-sm font-bold leading-7 text-[#5b5144]">
              <div>
                النسخة المثبتة:{" "}
                <strong>
                  {currentVersion || "غير محددة"}
                </strong>
              </div>
              {latest?.version ? (
                <div>
                  أحدث نسخة:{" "}
                  <strong>{latest.version}</strong>
                </div>
              ) : null}
              {latest?.sizeBytes ? (
                <div>
                  حجم APK:{" "}
                  <strong>
                    {readableSize(
                      latest.sizeBytes,
                    )}
                  </strong>
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-sm font-bold leading-7 text-[#4c453c]">
              {state === "checking"
                ? "جارٍ فحص GitHub Releases…"
                : message ||
                  "اضغط فحص التحديثات."}
            </p>

            <div className="mt-5 grid gap-2">
              {state === "available" ? (
                <button
                  type="button"
                  onClick={() =>
                    void downloadUpdate()
                  }
                  className="rounded-2xl bg-[#123f39] px-5 py-3.5 font-black text-white"
                >
                  تنزيل التحديث {latest?.version}
                </button>
              ) : null}

              {state !== "checking" ? (
                <button
                  type="button"
                  onClick={() =>
                    void checkForUpdate()
                  }
                  className="rounded-2xl border border-[#cdb989] bg-white px-5 py-3 font-black text-[#123f39]"
                >
                  فحص التحديثات
                </button>
              ) : null}
            </div>

            <p className="mt-4 text-[11px] font-bold leading-6 text-[#877862]">
              تحديثات صفحات ضاديوم والمحتوى والمنطق تصل من السيرفر مباشرة ولا تحتاج APK جديد. هذا الزر مخصص للتغييرات Native مثل إضافات Android والصلاحيات ومحركات الجهاز.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
