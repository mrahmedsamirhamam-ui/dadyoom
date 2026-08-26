import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قاموس السياق",
  description: "حلّل معنى الكلمة داخل الجملة، وتعرّف إلى معناها البسيط ومرادفاتها وأضدادها وجذرها في قاموس ضاديوم السياقي.",
  alternates: { canonical: "/dictionary" },
};

export default function DictionaryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
