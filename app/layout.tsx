import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import DadCompanion from "@/components/dad-ai/DadCompanion";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ضاديوم | بيت العربية الرقمي",
  description:
    "منصة تفاعلية لتعليم اللغة العربية وتنمية مهارات القراءة والكتابة والاستماع والتحدث.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-[#FFFDF7] text-slate-900">
        {children}
        <DadCompanion pageTitle="ضاديوم" />
      </body>
    </html>
  );
}