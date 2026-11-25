import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ProfileOnboardingForm from "@/components/auth/ProfileOnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { isCountryCode } from "@/lib/countries";
import { safeSelfSignupRole } from "@/lib/auth/role-policy";
import { isOnboardingRpcEnabled } from "@/lib/auth/onboarding-activation";

const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("role,full_name,country")
    .eq("id", user.id)
    .maybeSingle();

  // When the activated RPC is available, only an incomplete baseline profile
  // may still be awaiting one-time role selection. The form is presentation
  // only; the RPC token, not this page, authorizes the change.
  const storedRole = existing?.role?.trim().toLowerCase() ?? "";
  const profileIsComplete = Boolean(
    existing?.full_name?.trim() && existing?.country?.trim(),
  );
  const incompleteBaseline =
    (!storedRole || storedRole === "student") && !profileIsComplete;
  if (storedRole && !(isOnboardingRpcEnabled() && incompleteBaseline)) {
    redirect(destinations[storedRole] || "/student");
  }

  const metadata = user.user_metadata ?? {};
  const metadataName = typeof metadata.full_name === "string" ? metadata.full_name.trim() :
    typeof metadata.name === "string" ? metadata.name.trim() : "";
  // Legacy/user metadata is never an authority for a privileged role.
  const metadataRole = safeSelfSignupRole(metadata.role);
  const metadataCountry = typeof metadata.country === "string" ? metadata.country.trim().toUpperCase() : "BH";

  return (
    <AuthShell title="أكمل ملفك" description="خطوة واحدة فقط لنختار التجربة الأنسب لك داخل ضاديوم.">
      <ProfileOnboardingForm
        defaultName={metadataName || user.email?.split("@")[0] || ""}
        defaultRole={metadataRole}
        defaultCountry={isCountryCode(metadataCountry) ? metadataCountry : "BH"}
      />
    </AuthShell>
  );
}
