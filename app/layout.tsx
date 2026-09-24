import MobileOAuthBridge from "@/components/mobile/MobileOAuthBridge";
import DadyoomAds from "@/components/ads/DadyoomAds";
import type { Metadata, Viewport } from "next";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_LATIN,
  SITE_TAGLINE,
} from "@/lib/site";
import "./globals.css";

import NativeMobileShell from "@/components/mobile/NativeMobileShell";
import NativeAppUpdater from "@/components/mobile/NativeAppUpdater";
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
      SITE_NAME_LATIN,
      SITE_NAME,
    ],
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "ar",
  },
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    alternateName: SITE_NAME_LATIN,
    url: siteUrl,
    description: SITE_DESCRIPTION,
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} ${SITE_NAME_LATIN} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME} ${SITE_NAME_LATIN}`,
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
    siteName: `${SITE_NAME} ${SITE_NAME_LATIN}`,
    title: `${SITE_NAME} ${SITE_NAME_LATIN} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} ${SITE_NAME_LATIN} | ${SITE_TAGLINE}`,
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
  appleWebApp: {
    capable: true,
    title: "ضاديوم",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#174f47",
  colorScheme: "light",
  viewportFit: "cover",
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
        <NativeAppUpdater />
        <DadyoomInstallPrompt />
        <DadyoomAutoUpdate />
        <DadCompanion />
        {children}
      </body>
    </html>
  );
}
