import MobileOAuthBridge from "@/components/mobile/MobileOAuthBridge";
import DadyoomAds from "@/components/ads/DadyoomAds";
import type { Metadata, Viewport } from "next";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";
import "./globals.css";

import NativeMobileShell from "@/components/mobile/NativeMobileShell";
import DadCompanion from "@/components/dad-ai/DadCompanion";
import DadyoomInstallPrompt from "@/components/pwa/DadyoomInstallPrompt";
import DadyoomAutoUpdate from "@/components/pwa/DadyoomAutoUpdate";

const siteUrl = getSiteUrl();

const googleVerification =
  process.env.GOOGLE_SITE_VERIFICATION?.trim();

const bingVerification =
  process.env.BING_SITE_VERIFICATION?.trim();

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: [
      "Dadyoom",
      "ضاديوم",
    ],
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "ar",
  },
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    alternateName: "Dadyoom",
    url: siteUrl,
    description: SITE_DESCRIPTION,
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  category: "education",
  alternates: {
    canonical: "/",
    languages: {
      ar: "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google:
      googleVerification ||
      undefined,
    other:
      bingVerification
        ? {
            "msvalidate.01":
              bingVerification,
          }
        : undefined,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#174f47",
  colorScheme: "light",
};

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(
    /</gu,
    "\\u003c",
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="h-full antialiased"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-full flex-col bg-[#fffaf0] text-[#27231f]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              jsonLd(
                structuredData,
              ),
          }}
        />
        <DadyoomAds />
        <MobileOAuthBridge />
        <NativeMobileShell />
        <DadyoomInstallPrompt />
        <DadyoomAutoUpdate />
        <DadCompanion />
        {children}
      </body>
    </html>
  );
}
