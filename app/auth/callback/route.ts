import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import {
  isKnownRole,
  isSelfSignupRole,
  normalizeRole,
  safeSelfSignupRole,
} from "@/lib/auth/role-policy";
import {
  isOnboardingRpcEnabled,
  ONBOARDING_COMPLETE_RPC,
} from "@/lib/auth/onboarding-activation";

const roleDestinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function parseIntent(raw: string | undefined) {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const value = JSON.parse(json) as { fullName?: string; role?: string; country?: string };
    const role = normalizeRole(value.role);
    const country = typeof value.country === "string" ? value.country.trim().toUpperCase() : "";
    const fullName = typeof value.fullName === "string" ? value.fullName.trim().slice(0, 120) : "";
    if (!fullName || !isKnownRole(role) || !isCountryCode(country)) return null;
    return { fullName, role, country };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = safeNext(url.searchParams.get("next"));
  const origin = url.origin;

  if (!code) return NextResponse.redirect(new URL("/login?error=oauth_callback", origin));

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return NextResponse.redirect(new URL("/login?error=oauth_exchange", origin));

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !user.email) return NextResponse.redirect(new URL("/login?error=oauth_user", origin));

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.redirect(new URL("/onboarding?error=profile_lookup", origin));
  }

  const cookieStore = await cookies();
  const intent = parseIntent(cookieStore.get("dadyoom_oauth_intent")?.value);
  const rpcEnabled = isOnboardingRpcEnabled();
  const storedRole = normalizeRole(existingProfile?.role);
  const profileIsComplete = Boolean(
    existingProfile?.country?.trim() && existingProfile?.full_name?.trim(),
  );
  const incompleteBaseline =
    (!storedRole || storedRole === "student") && !profileIsComplete;
  const canUseRpc =
    rpcEnabled &&
    Boolean(intent) &&
    isSelfSignupRole(intent!.role) &&
    incompleteBaseline;

  if (
    existingProfile?.role &&
    existingProfile?.country &&
    existingProfile?.full_name?.trim() &&
    !canUseRpc
  ) {
    // The stored role is authoritative. OAuth intent is registration input
    // only and can never override an existing authorization decision.
    const response = NextResponse.redirect(new URL(requestedNext || roleDestinations[storedRole] || "/student", origin));
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  if (!intent) {
    const response = NextResponse.redirect(new URL("/onboarding", origin));
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  // A teacher/school OAuth selection is not proof of approval. Downgrade to a
  // self-signup role; privileged issuance needs a separate verified workflow.
  const initialRole = safeSelfSignupRole(intent.role);

  if (canUseRpc) {
    const { data: rpcRole, error: rpcError } = await supabase.rpc(
      ONBOARDING_COMPLETE_RPC,
      {
        p_full_name: intent.fullName,
        p_country: intent.country,
        p_role: initialRole,
      },
    );
    const response = NextResponse.redirect(
      new URL(
        rpcError || normalizeRole(rpcRole) !== initialRole
          ? "/onboarding?error=profile_onboarding"
          : requestedNext || roleDestinations[initialRole] || "/student",
        origin,
      ),
    );
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  const admin = createAdminClient();
  const { error: profileWriteError } = await admin.from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: intent.fullName,
      role: initialRole,
      country: intent.country,
    })
    .select("id,role")
    .maybeSingle();

  if (profileWriteError) {
    const { data: racedProfile, error: racedError } = await supabase
      .from("profiles")
      .select("role,country,full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (racedError || !racedProfile?.role || !racedProfile?.country?.trim() || !racedProfile?.full_name?.trim()) {
      console.error("GOOGLE_PROFILE_INSERT_ERROR:", profileWriteError.message);
      return NextResponse.redirect(new URL("/onboarding?error=profile_create", origin));
    }
    const racedRole = normalizeRole(racedProfile.role);
    const response = NextResponse.redirect(new URL(requestedNext || roleDestinations[racedRole] || "/student", origin));
    response.cookies.delete("dadyoom_oauth_intent");
    return response;
  }

  const response = NextResponse.redirect(
    new URL(requestedNext || roleDestinations[initialRole] || "/student", origin),
  );
  response.cookies.delete("dadyoom_oauth_intent");
  return response;
}
