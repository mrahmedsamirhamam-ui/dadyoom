import { redirect } from "next/navigation";
import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";
import { signedInDestination } from "@/lib/auth/signed-in-destination";

export default async function LoginPage() {
  const destination = await signedInDestination();
  if (destination) redirect(destination);
  return <EmailPasswordAuthForm mode="login" />;
}
