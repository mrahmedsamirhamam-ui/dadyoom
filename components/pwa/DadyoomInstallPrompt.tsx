"use client";

import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type Platform = "android" | "ios" | "other";
type HelpMode = "android" | "ios" | null;

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";

  const ua = navigator.userAgent.toLowerCase();
  const platform =
    typeof navigator.platform === "string"
      ? navigator.platform.toLowerCase()
      : "";

  const touchMac =
    platform.includes("mac") &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;

  if (/iphone|ipad|ipod/u.test(ua) || touchMac) {
    return "ios";
  }

  if (/android/u.test(ua)) {
    return "android";
  }

  return "other";
}

function isStandalone() {
  if (typeof window === "undefined") return false;

  const nav =
    navigator as Navigator & {
      standalone?: boolean;
    };

  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    nav.standalone === true
  );
}

function isNativeCapacitor() {
  if (typeof window === "undefined") return false;

  const candidate =
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
      };
    };

  return (
    candidate.Capacitor?.isNativePlatform?.() === true ||
    document.documentElement.classList.contains("dadyoom-native-app")
  );
}

export default function DadyoomInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [helpMode, setHelpMode] = useState<HelpMode>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nativeApp, setNativeApp] = useState(false);

  const platform = useMemo(() => detectPlatform(), []);

  useEffect(() => {
    const environmentTimer = window.setTimeout(() => {
      setInstalled(isStandalone());
      setNativeApp(isNativeCapacitor());
    }, 0);

    if (
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" ||
        window.location.hostname === "localhost")
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(environmentTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installAndroid() {
    setHelpMode(null);

    if (platform === "ios") {
      setHelpMode("android");
      return;
    }

    if (!deferredPrompt) {
      setHelpMode("android");
      return;
    }

    setBusy(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setInstalled(true);
        setOpen(false);
      } else {
        setHelpMode("android");
      }
    } finally {
      setDeferredPrompt(null);
      setBusy(false);
    }
  }

  if (installed || nativeApp) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setHelpMode(null);
        }}
        className="fixed bottom-4 left-4 z-[80] rounded-2xl border border-[#d7bd78] bg-[#123f39] px-4 py-3 text-sm font-black text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#174f47] active:translate-y-0"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="تنزيل ضاديوم على الهاتف"
      >
        تنزيل ضاديوم على الهاتف
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOpen(false);
            }
          }}
        >
          <section
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dadyoom-install-title"
            className="w-full max-w-lg rounded-[2rem] border border-[#dfc98f] bg-[#fffaf0] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-[#a27a27]">
                  تطبيق ضاديوم من المتصفح — مجانًا
                </p>
                <h2
                  id="dadyoom-install-title"
                  className="mt-1 text-2xl font-black text-[#123f39]"
                >
                  نزّل ضاديوم على هاتفك
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#625b50]">
                  سيظهر ضاديوم بأيقونة على الشاشة الرئيسية ويفتح كتطبيق مستقل.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#dfd2b6] bg-white px-3 py-1.5 text-lg font-black text-[#625b50]"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void installAndroid()}
                disabled={busy}
                className="rounded-2xl border-2 border-[#123f39] bg-[#123f39] p-4 text-right text-white transition hover:bg-[#174f47] disabled:opacity-60"
              >
                <span className="block text-lg font-black">
                  تنزيل للأندرويد
                  {platform === "android" ? " — جهازك" : ""}
                </span>
                <span className="mt-1 block text-xs leading-5 text-white/80">
                  Chrome والمتصفحات الداعمة
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHelpMode("ios")}
                className="rounded-2xl border-2 border-[#c49a43] bg-white p-4 text-right text-[#123f39] transition hover:bg-[#fff4d9]"
              >
                <span className="block text-lg font-black">
                  تنزيل للآيفون
                  {platform === "ios" ? " — جهازك" : ""}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#75684f]">
                  iPhone وiPad
                </span>
              </button>
            </div>

            {busy ? (
              <div className="mt-4 rounded-2xl bg-[#edf5f1] p-4 text-sm font-bold text-[#123f39]">
                جارٍ فتح نافذة تثبيت ضاديوم…
              </div>
            ) : null}

            {helpMode === "android" ? (
              <div className="mt-5 rounded-2xl border border-[#d8c7a6] bg-white p-4">
                <h3 className="font-black text-[#123f39]">
                  تثبيت ضاديوم على Android
                </h3>
                <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm leading-7 text-[#5f574d]">
                  <li>افتح ضاديوم في Chrome.</li>
                  <li>افتح قائمة المتصفح ⋮.</li>
                  <li>اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
                  <li>اضغط «تثبيت».</li>
                </ol>
                <p className="mt-3 text-xs leading-6 text-[#7a715f]">
                  إذا أتاح المتصفح التثبيت المباشر، زر الأندرويد نفسه يفتح نافذة التثبيت.
                </p>
              </div>
            ) : null}

            {helpMode === "ios" ? (
              <div className="mt-5 rounded-2xl border border-[#d8c7a6] bg-white p-4">
                <h3 className="font-black text-[#123f39]">
                  تثبيت ضاديوم على iPhone
                </h3>
                <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm leading-7 text-[#5f574d]">
                  <li>افتح ضاديوم في Safari.</li>
                  <li>اضغط «مشاركة» من قائمة Safari.</li>
                  <li>اختر «إضافة إلى الشاشة الرئيسية».</li>
                  <li>اترك «فتح كتطبيق ويب» مفعّلًا إن ظهر، ثم اضغط «إضافة».</li>
                </ol>
                <p className="mt-3 text-xs leading-6 text-[#7a715f]">
                  خطوة «إضافة» الأخيرة تتم من قائمة iPhone نفسها لأن Apple لا تسمح للموقع بتنفيذها نيابةً عن المستخدم.
                </p>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-[#f5ead0] px-4 py-3 text-xs font-bold leading-6 text-[#695936]">
              لا Google Play ولا App Store مطلوبان لهذا التثبيت، ولا يتم تنزيل ملف APK أو IPA.
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
