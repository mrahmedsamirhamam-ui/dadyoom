import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401, headers: noStore });
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "PROFILE_UNAVAILABLE" }, { status: 503, headers: noStore });
  }

  // Incomplete profiles always finish their own onboarding; neither metadata
  // nor an arbitrary destination provided by the browser can override this.
  const complete = Boolean(
    profile?.full_name?.trim() && profile?.country?.trim() &&
    destinationForStoredRole(profile?.role) !== "/onboarding",
  );
  const destination = complete ? destinationForStoredRole(profile?.role) : "/onboarding";
  return NextResponse.json({ destination }, { headers: noStore });
}
