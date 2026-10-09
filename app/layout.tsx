import type { Metadata, Viewport } from "next";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_LATIN,
} from "@/lib/site";
import "./globals.css";
import DadyoomClientRuntime from "@/components/runtime/DadyoomClientRuntime";
import { SiteLanguageProvider, LanguageSwitcher } from "@/components/i18n/LanguageProvider";


const siteUrl = getSiteUrl();
const homeSeoTitle = `${SITE_NAME} | ${SITE_NAME_LATIN} — منصة تعليم اللغة العربية`;

const googleVerification =
  process.env.GOOGLE_SITE_VERIFICATION?.trim();

const bingVerification =
  process.env.BING_SITE_VERIFICATION?.trim();

const adsenseCandidate =
  process.env.ADSENSE_CLIENT?.trim() ||
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
  "";

const adsenseClient =
  /^ca-pub-\d{16}$/u.test(adsenseCandidate)
    ? adsenseCandidate
    : undefined;

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: SITE_NAME,
    alternateName: [SITE_NAME_LATIN, new URL(siteUrl).hostname],
    url: `${siteUrl}/`,
    description: SITE_DESCRIPTION,
    inLanguage: "ar",
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    alternateName: [SITE_NAME_LATIN, new URL(siteUrl).hostname],
    url: `${siteUrl}/`,
    description: SITE_DESCRIPTION,
    logo: `${siteUrl}/pwa/icon-512.png`,
  },
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: homeSeoTitle,
    template: `%s | ${SITE_NAME_LATIN}`,
  },
  description: SITE_DESCRIPTION,
  category: "education",
  openGraph: {
    type: "website",
    locale: "ar_AR",
    siteName: SITE_NAME,
    title: homeSeoTitle,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: homeSeoTitle,
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
  other: adsenseClient
    ? {
        "google-adsense-account": adsenseClient,
      }
    : undefined,
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

const staleChunkRecoveryScript = String.raw`(function () {
  if (window.__dadyoomAssetRecoveryInstalled) return;
  window.__dadyoomAssetRecoveryInstalled = true;
  var key = "dadyoom_asset_retry_v1";
  function isOwnChunk(address) {
    if (!address) return false;
    try {
      var url = new URL(String(address), window.location.href);
      return url.origin === window.location.origin &&
        url.pathname.indexOf("/_next/static/chunks/") === 0;
    } catch (_) { return false; }
  }
  function isChunkFailure(event) {
    var target = event && event.target;
    var address = target && (target.src || target.href);
    if (isOwnChunk(address)) return true;
    var reason = event && (event.reason || event.error || event.message);
    var message = String(reason && reason.message || reason || "");
    return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk.*failed|ChunkLoadError/i.test(message) &&
      message.indexOf("/_next/static/chunks/") !== -1 &&
      message.indexOf(window.location.origin) !== -1;
  }
  function recover() {
    var current = window.location;
    if (/^\\/auth(?:\\/|$)/.test(current.pathname) ||
        new URL(current.href).searchParams.has("code")) return;
    var now = Date.now();
    try {
      var previous = JSON.parse(window.sessionStorage.getItem(key) || "{}");
      if (previous.path === current.pathname && now - Number(previous.at || 0) < 300000) return;
      window.sessionStorage.setItem(key, JSON.stringify({ path: current.pathname, at: now }));
    } catch (_) { return; }
    var fresh = new URL(current.href);
    fresh.searchParams.set("dadyoom_asset_retry", String(now));
    current.replace(fresh.toString());
  }
  function onFailure(event) {
    if (isChunkFailure(event)) recover();
  }
  window.addEventListener("error", onFailure, true);
  window.addEventListener("unhandledrejection", onFailure);
})();`;

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
      <head>
        {/* Runs before client chunks, so a stale deployment can self-recover once. */}
        <script dangerouslySetInnerHTML={{ __html: staleChunkRecoveryScript }} />
      </head>
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
        <SiteLanguageProvider>
          <DadyoomClientRuntime />
          {children}
          <LanguageSwitcher floating />
        </SiteLanguageProvider>
      </body>
    </html>
  );
}
