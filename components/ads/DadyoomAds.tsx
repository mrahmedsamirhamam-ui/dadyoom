"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ?? "";
const key = "dadyoom.ads-consent.v1";
const blockedPrefixes = [
  "/lessons/", "/student/", "/teacher/", "/school/", "/admin/",
  "/payments/", "/ask", "/dad", "/skills/", "/campaign", "/landing",
  "/login", "/signup",
];

function isNativeMobileApp(): boolean {
  const candidate = window as typeof window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return candidate.Capacitor?.isNativePlatform?.() === true ||
    document.documentElement.classList.contains("dadyoom-native-app");
}

function optedIn(): boolean {
  try {
    return window.localStorage.getItem(key) === "allow";
  } catch {
    return false;
  }
}

function removeScript() {
  document.querySelector('script[data-dadyoom-adsense="1"]')?.remove();
}

/**
 * Fail closed: server validates plan, account role, active plan row and ad readiness.
 * The client also requires explicit opt-in, a permitted route and a real publisher ID.
 * No public-route advertising for anonymous visitors or learner accounts.
 */
export default function DadyoomAds() {
  const pathname = usePathname();
  useEffect(() => {
    let cancelled = false;
    const excluded = blockedPrefixes.some(prefix => pathname.startsWith(prefix));
    if (!client || excluded || isNativeMobileApp()) {
      removeScript();
      return;
    }

    async function tryLoad() {
      if (!optedIn()) {
        removeScript();
        return;
      }
      try {
        const response = await fetch("/api/billing/status", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          removeScript();
          return;
        }
        const payload = (await response.json()) as { showAds?: boolean };
        if (cancelled || !payload.showAds || isNativeMobileApp()) {
          removeScript();
          return;
        }
        if (document.querySelector('script[data-dadyoom-adsense="1"]')) return;
        const script = document.createElement("script");
        script.async = true;
        script.crossOrigin = "anonymous";
        script.dataset.dadyoomAdsense = "1";
        script.src =
          "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
          encodeURIComponent(client);
        if (!cancelled) document.head.appendChild(script);
      } catch {
        removeScript();
      }
    }
    void tryLoad();
    window.addEventListener("dadyoom-ad-consent-change", tryLoad);
    return () => {
      cancelled = true;
      window.removeEventListener("dadyoom-ad-consent-change", tryLoad);
    };
  }, [pathname]);
  return null;
}
