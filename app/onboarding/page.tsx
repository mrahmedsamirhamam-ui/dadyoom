import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import ProfileOnboardingForm from "@/components/auth/ProfileOnboardingForm";
import { createClient } from "@/lib/supabase/server";
import { isCountryCode } from "@/lib/countries";

const destinations: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

const allowedRoles = new Set(["student", "teacher", "parent", "school"]);

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.role) {
    const role = existing.role.trim().toLowerCase();
    redirect(destinations[role] || "/student");
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
        defaultRole={allowedRoles.has(metadataRole) ? metadataRole as "student" | "teacher" | "parent" | "school" : "student"}
        defaultCountry={isCountryCode(metadataCountry) ? metadataCountry : "BH"}
      />
    </AuthShell>
  );
}
