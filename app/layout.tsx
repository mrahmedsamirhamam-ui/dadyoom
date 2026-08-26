import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import DadCompanion from "@/components/dad-ai/DadCompanion";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";
import "./globals.css";

const kufi = Noto_Kufi_Arabic({
  variable: "--font-arabic-kufi",
  subsets: ["arabic"],
  display: "swap",
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-arabic-naskh",
  subsets: ["arabic"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  category: "education",
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
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#174f47",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${kufi.variable} ${naskh.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[#fffaf0] text-[#27231f]">
        {children}
        <DadCompanion pageTitle="ضاديوم" />
      </body>
    </html>
  );
}
