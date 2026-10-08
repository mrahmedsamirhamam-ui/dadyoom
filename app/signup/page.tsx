import type { Metadata } from "next";

import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Keep auth HTML aligned with its current hashed JavaScript assets across deployments.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignupPage() {
  return <EmailPasswordAuthForm mode="signup" />;
}
