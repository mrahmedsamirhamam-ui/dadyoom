import type { Metadata } from "next";

import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function LoginPage() {
  return <EmailPasswordAuthForm mode="login" />;
}
