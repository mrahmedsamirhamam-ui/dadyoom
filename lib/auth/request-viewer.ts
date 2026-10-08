import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The three nested dashboard / role / student Server Components share
 * one user authentication and profiles read per server render.
 * React.cache is request-scoped: this does not cache personal data
 * across users, requests, logins, or browsers.
 * Authorization checks remain in each component.
 */
export const getDashboardRequestViewer = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      userError,
      profile: null,
      profileError: null,
    };
  }

  const loadProfile = () =>
    supabase.from("profiles")
      .select(
        "full_name,role,country,grade_number,onboarding_completed,interests,learning_goal,preferred_learning_style,grade_academic_year",
      )
      .eq("id", user.id)
      .maybeSingle();

  let result = await loadProfile();
  if (result.error || !result.data) {
    console.warn(
      "DADYOOM_SHARED_PROFILE_RETRY",
      result.error?.message ?? "profile-not-returned",
    );
    result = await loadProfile();
  }

  return {
    supabase,
    user,
    userError: null,
    profile: result.data,
    profileError: result.error,
  };
});
