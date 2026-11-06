import { redirect } from "next/navigation";
import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";
import { createClient } from "@/lib/supabase/server";

// A valid retained session skips the login form entirely. /my resolves the
// dashboard from the authenticated profile on the server, never URL metadata.
export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ password_reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!error && user) redirect("/my");

  const params = await searchParams;
  return <EmailPasswordAuthForm mode="login" passwordWasReset={params.password_reset === "1"} />;
}
