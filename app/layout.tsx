import type { Metadata, Viewport } from "next";
import {
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_ARABIC_ALT,
  SITE_NAME_LATIN,
  SITE_TAGLINE,
} from "@/lib/site";
import "./globals.css";
import DadyoomClientRuntime from "@/components/runtime/DadyoomClientRuntime";



const siteUrl = getSiteUrl();

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: SITE_NAME,
  alternateName: [
      SITE_NAME_LATIN,
      SITE_NAME_ARABIC_ALT,
    ],
  description: SITE_DESCRIPTION,
  inLanguage: "ar",
  creator: {
    "@type": "Person",
    "@id": `${siteUrl}/founder#person`,
    name: "أ. أحمد سمير محمد حافظ حمام",
    alternateName: "Mr Ahmed Samir Mohamed Hafez Hamam",
    url: `${siteUrl}/founder`,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} ${SITE_NAME_LATIN} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME} ${SITE_NAME_LATIN}`,
  },
  description: SITE_DESCRIPTION,
  category: "education",
  authors: [{ name: "Mr Ahmed Samir Mohamed Hafez Hamam", url: "/founder" }],
  creator: "Mr Ahmed Samir Mohamed Hafez Hamam",
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
  // Only enable when a verified Search Console property issues the token.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined,
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
      className={`h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col bg-[#fffaf0] text-[#27231f]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        <DadyoomClientRuntime />
        {children}
      </body>
    </html>
  );
}
