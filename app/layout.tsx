import type { Metadata, Viewport } from "next";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_ARABIC_ALT,
  SITE_NAME_ARABIC_ALT_DADYOOM,
  SITE_NAME_ARABIC_ALT_SHORT,
  SITE_NAME_LATIN,
} from "@/lib/site";
import "./globals.css";
import DadyoomClientRuntime from "@/components/runtime/DadyoomClientRuntime";


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
    alternateName: [
      SITE_NAME_LATIN,
      SITE_NAME_ARABIC_ALT,
      SITE_NAME_ARABIC_ALT_DADYOOM,
      SITE_NAME_ARABIC_ALT_SHORT,
    ],
    url: siteUrl,
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
    alternateName: [
      SITE_NAME_LATIN,
      SITE_NAME_ARABIC_ALT,
      SITE_NAME_ARABIC_ALT_DADYOOM,
      SITE_NAME_ARABIC_ALT_SHORT,
    ],
    url: siteUrl,
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
    siteName: `${SITE_NAME} ${SITE_NAME_LATIN}`,
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
        <DadyoomClientRuntime />
        {children}
      </body>
    </html>
  );
}
