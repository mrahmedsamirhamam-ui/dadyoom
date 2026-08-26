import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "اسأل ضاد",
  description: "جرّب ضاد، رفيق العربية الذكي، واسأل عن المفردات والقواعد والمهارات باللغة العربية.",
  alternates: { canonical: "/ask" },
};

export default function AskLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
