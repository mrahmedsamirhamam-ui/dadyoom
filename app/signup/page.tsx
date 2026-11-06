import { redirect } from "next/navigation";
import EmailPasswordAuthForm from "@/components/auth/EmailPasswordAuthForm";
import { createClient } from "@/lib/supabase/server";

// Signed-in learners should never be asked to register a second account.
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!error && user) redirect("/my");

  return <EmailPasswordAuthForm mode="signup" />;
}
