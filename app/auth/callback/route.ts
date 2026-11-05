import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";

function parseIntent(raw: string | undefined) {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const value = JSON.parse(json) as { fullName?: string; role?: string; country?: string };
    const role = typeof value.role === "string" ? value.role.trim().toLowerCase() : "student";
    const country = typeof value.country === "string" ? value.country.trim().toUpperCase() : "";
    const fullName = typeof value.fullName === "string" ? value.fullName.trim().slice(0, 120) : "";
    if (!fullName || !new Set(["student", "child", "teacher", "parent", "school"]).has(role) || !isCountryCode(country)) return null;
    return { fullName, role, country };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) return NextResponse.redirect(new URL("/login?error=oauth_callback", origin));

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL("/login?error=oauth_exchange", origin));

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !user.email) return NextResponse.redirect(new URL("/login?error=oauth_user", origin));

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  const cookieStore = await cookies();
  const intent = parseIntent(cookieStore.get("dadyoom_oauth_intent")?.value);

  if (existingProfile?.role && existingProfile?.country && existingProfile?.full_name?.trim()) {
    const role = existingProfile.role.trim().toLowerCase();
    const response = NextResponse.redirect(new URL(destinationForStoredRole(role), origin));
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  // An existing stored role is authoritative even if a profile is incomplete.
  // Never overwrite it using an untrusted signup intent cookie.
  if (existingProfile?.role) {
    const response = NextResponse.redirect(new URL("/onboarding", origin));
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  if (!intent) {
    const response = NextResponse.redirect(new URL("/onboarding", origin));
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  const fullName = intent.fullName ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "") ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "") ||
    user.email.split("@")[0];

  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: intent.role,
      country: intent.country,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    const { data: racedProfile } = await supabase
      .from("profiles")
      .select("role,country,full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (!racedProfile?.role || !racedProfile?.country || !racedProfile?.full_name?.trim()) {
      console.error("GOOGLE_PROFILE_INSERT_ERROR:", profileError.message);
      return NextResponse.redirect(new URL("/onboarding?error=profile_create", origin));
    }
    const racedRole = racedProfile.role.trim().toLowerCase();
    return NextResponse.redirect(new URL(destinationForStoredRole(racedRole), origin));
  }

  const response = NextResponse.redirect(new URL(destinationForStoredRole(intent.role), origin));
  response.cookies.delete("dadyoom_oauth_intent");
  return response;
}
