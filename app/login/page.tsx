import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";

export const dynamic = "force-static";
export const revalidate = 86400;

export default function LoginPage() {
  return <EmailPasswordAuthForm mode="login" />;
}
