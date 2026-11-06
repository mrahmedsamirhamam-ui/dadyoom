import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ProfileOnboardingForm from "@/components/auth/ProfileOnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { isCountryCode } from "@/lib/countries";

const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

const selfSignupRoles = new Set(["student", "child", "parent"]);
const storedRoles = new Set(["student", "child", "teacher", "parent", "school", "admin"]);

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: existing, error: profileError } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) redirect("/login?error=profile_lookup");
  const storedRole = typeof existing?.role === "string"
    ? existing.role.trim().toLowerCase()
    : null;
  if (storedRole && !storedRoles.has(storedRole)) redirect("/login?error=unknown_role");
  if (storedRole && existing?.country && existing?.full_name?.trim()) {
    redirect(destinations[storedRole] || "/login");
  }

  const metadata = user.user_metadata ?? {};
  const metadataName = typeof metadata.full_name === "string" ? metadata.full_name.trim() :
    typeof metadata.name === "string" ? metadata.name.trim() : "";
  const metadataRole = typeof metadata.role === "string" ? metadata.role.trim().toLowerCase() : "student";
  const metadataCountry = typeof metadata.country === "string" ? metadata.country.trim().toUpperCase() : "BH";

  return (
    <AuthShell title="أكمل ملفك" description="خطوة واحدة فقط لنختار التجربة الأنسب لك داخل ضاديوم.">
      <ProfileOnboardingForm
        defaultName={metadataName || user.email?.split("@")[0] || ""}
        defaultRole={(storedRole || (selfSignupRoles.has(metadataRole) ? metadataRole : "student")) as "student" | "child" | "teacher" | "parent" | "school" | "admin"}
        storedRole={storedRole as "student" | "child" | "teacher" | "parent" | "school" | "admin" | null}
        defaultCountry={isCountryCode(metadataCountry) ? metadataCountry : "BH"}
      />
    </AuthShell>
  );
}
