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
  // Floating launchers must not cover answer choices or the submit control.
  const answeringQuestions = /^\/(?:quiz|assessment)(?:\/|$)/u.test(pathname ?? "");

  return (
    <>
      <DadyoomAds />
      <MobileOAuthBridge />
      <NativeMobileShell />
      {!answeringQuestions && <DadyoomInstallPrompt />}
      <DadyoomAutoUpdate />
      {!answeringQuestions && <DadCompanion />}
    </>
  );
}
