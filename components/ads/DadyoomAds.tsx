"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const client =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";

const blockedPrefixes = [
  "/lessons/",
  "/student/",
  "/teacher/",
  "/school/",
  "/admin/",
  "/payments/",
];

function isNativeMobileApp() {
  const candidate =
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
      };
    };

  return (
    candidate.Capacitor?.isNativePlatform?.() === true ||
    document.documentElement.classList.contains(
      "dadyoom-native-app",
    )
  );
}

export default function DadyoomAds() {
  const pathname = usePathname();

  useEffect(() => {
    if (!client || isNativeMobileApp()) {
      return;
    }

    if (
      blockedPrefixes.some((prefix) =>
        pathname.startsWith(prefix),
      )
    ) {
      return;
    }

    let cancelled = false;

    void fetch("/api/billing/status", {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((payload: { showAds?: boolean }) => {
        if (
          cancelled ||
          !payload.showAds ||
          isNativeMobileApp() ||
          document.querySelector(
            'script[data-dadyoom-adsense="1"]',
          )
        ) {
          return;
        }

        const script = document.createElement("script");

        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.dadyoomAdsense = "1";
        script.src =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
          encodeURIComponent(client);

        document.head.appendChild(script);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
