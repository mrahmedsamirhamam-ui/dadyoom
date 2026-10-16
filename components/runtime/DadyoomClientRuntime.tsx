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

const NativeAppUpdater = dynamic(
  () => import("@/components/mobile/NativeAppUpdater"),
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
  const pathname = usePathname() ?? "";
  // The floating student companion must not cover teacher/admin/school form
  // actions; those workspaces provide their own explicit AI/support tools.
  const workflowWorkspace = /^\/(?:teacher|school|admin|parent|login|signup|register|onboarding|checkout|settings)(?:\/|$)/u.test(pathname);
  return (
    <>
      <DadyoomAds />
      <MobileOAuthBridge />
      <NativeMobileShell />
      <NativeAppUpdater />
      <DadyoomInstallPrompt />
      <DadyoomAutoUpdate />
      {workflowWorkspace ? null : <DadCompanion />}
    </>
  );
}
