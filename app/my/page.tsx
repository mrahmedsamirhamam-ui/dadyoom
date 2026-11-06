import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";

// This is the user's own space, not a generic homepage. Never decide the
// destination using URL parameters, localStorage or auth.user_metadata.
export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("تعذر تحديد لوحة حسابك. حاول مرة أخرى.");
  }

  if (!profile?.full_name?.trim() || !profile?.country?.trim()) {
    redirect("/onboarding");
  }

  redirect(destinationForStoredRole(profile.role));
}
