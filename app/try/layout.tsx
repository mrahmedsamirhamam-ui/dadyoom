import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "جرّب العربية دون تسجيل | ضاديوم",
  description: "تجربة قصيرة مجانية بأسئلة وشروح عربية أصلية. لا حساب ولا بيانات طفل مطلوبة.",
  alternates: { canonical: "/try" },
};

export default function GuestTryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
