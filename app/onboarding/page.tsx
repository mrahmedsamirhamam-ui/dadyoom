import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ProfileOnboardingForm from "@/components/auth/ProfileOnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { isCountryCode } from "@/lib/countries";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";

const allowedRoles = new Set(["student", "child", "teacher", "parent", "school"]);

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  // A partially created profile must be editable here; redirecting based on
  // role alone caused /onboarding <-> dashboard infinite loops.
  const existingDestination = destinationForStoredRole(existing?.role);
  if (existingDestination !== "/onboarding" &&
      existing?.country?.trim() && existing?.full_name?.trim()) {
    redirect(existingDestination);
  }

  // Only a persisted, recognized role is locked. Auth metadata is a
  // convenience to prefill sign-up, never proof of teacher/admin privileges.
  const storedRole = typeof existing?.role === "string"
    ? existing.role.trim().toLowerCase() : "";
  const lockedRole = allowedRoles.has(storedRole) || storedRole === "admin";

  const metadata = user.user_metadata ?? {};
  const metadataName = typeof metadata.full_name === "string" ? metadata.full_name.trim() :
    typeof metadata.name === "string" ? metadata.name.trim() : "";
  // Metadata may prefill a registration form but cannot authorize a role.
  // An existing persisted role takes precedence for an incomplete profile.
  const metadataRole = lockedRole ? storedRole :
    typeof metadata.role === "string" ? metadata.role.trim().toLowerCase() : "student";
  const metadataCountry = typeof existing?.country === "string" && existing.country.trim()
    ? existing.country.trim().toUpperCase()
    : typeof metadata.country === "string" ? metadata.country.trim().toUpperCase() : "BH";

  return (
    <AuthShell title="أكمل ملفك" description="خطوة واحدة فقط لنختار التجربة الأنسب لك داخل ضاديوم.">
      <ProfileOnboardingForm
        defaultName={existing?.full_name?.trim() || metadataName || user.email?.split("@")[0] || ""}
        defaultRole={(allowedRoles.has(metadataRole) || (lockedRole && metadataRole === "admin")) ? metadataRole as "student" | "child" | "teacher" | "parent" | "school" | "admin" : "student"}
        lockedRole={lockedRole}
        defaultCountry={isCountryCode(metadataCountry) ? metadataCountry : "BH"}
      />
    </AuthShell>
  );
}
