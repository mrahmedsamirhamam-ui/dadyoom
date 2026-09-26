"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

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

function isValidClient(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^ca-pub-\d{16}$/u.test(value)
  );
}

export default function DadyoomAds() {
  const pathname = usePathname();

  useEffect(() => {
    // Ads are intentionally limited to the public home page only.
    // Student, teacher, school, auth, pricing, lessons, and every other
    // route stay ad-free regardless of future route additions.
    if (isNativeMobileApp() || pathname !== "/") {
      return;
    }

    let cancelled = false;

    void Promise.all([
      fetch("/api/billing/status", {
        cache: "no-store",
      }).then((response) => response.json()),
      fetch("/api/ads/config", {
        cache: "no-store",
      }).then((response) => response.json()),
    ])
      .then(
        ([
          billing,
          ads,
        ]: [
          { showAds?: boolean },
          { client?: string },
        ]) => {
          const client = ads.client;

          if (
            cancelled ||
            !billing.showAds ||
            !isValidClient(client) ||
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
        },
      )
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
