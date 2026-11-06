"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const DadyoomAds = dynamic(
  () => import("@/components/ads/DadyoomAds"),
  { ssr: false },
);

const MobileOAuthBridge = dynamic(
  () => import("@/components/mobile/MobileOAuthBridge"),
  { ssr: false },
);

const NativeMobileShell = dynamic(
  () => import("@/components/mobile/NativeMobileShell"),
  { ssr: false },
);

const DadyoomInstallPrompt = dynamic(
  () => import("@/components/pwa/DadyoomInstallPrompt"),
  { ssr: false },
);

const DadyoomAutoUpdate = dynamic(
  () => import("@/components/pwa/DadyoomAutoUpdate"),
  { ssr: false },
);

const DadCompanion = dynamic(
  () => import("@/components/dad-ai/DadCompanion"),
  { ssr: false },
);

export default function DadyoomClientRuntime() {
  const pathname = usePathname();
  // A first-time guest should finish the micro-lesson before being prompted
  // to install the app or open a separate assistant. Other routes are unchanged.
  const inGuestLesson = pathname === "/try";

  return (
    <>
      <DadyoomAds />
      <MobileOAuthBridge />
      <NativeMobileShell />
      {!inGuestLesson ? <DadyoomInstallPrompt /> : null}
      <DadyoomAutoUpdate />
      {!inGuestLesson ? <DadCompanion /> : null}
    </>
  );
}
