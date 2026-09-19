import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import ProfileOnboardingForm from "@/components/auth/ProfileOnboardingForm";
import { isCountryCode } from "@/lib/countries";
import { createClient } from "@/lib/supabase/server";
import {
  advanceGradeForAcademicYear,
  currentAcademicYear,
} from "@/lib/student/academic-year";

const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

const allowedRoles =
  new Set([
    "student",
    "child",
    "teacher",
    "parent",
    "school",
  ]);

function countryCandidate(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim().toUpperCase()
    : "";
}

export default async function OnboardingPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: existing } =
    await supabase
      .from("profiles")
      .select(
        "role,country,full_name,grade_number,interests,learning_goal,preferred_learning_style,onboarding_completed,grade_academic_year",
      )
      .eq("id", user.id)
      .maybeSingle();

  const existingRole =
    existing?.role
      ?.trim()
      .toLowerCase() || "";

  const studentLike =
    existingRole === "student" ||
    existingRole === "child";

  if (
    existingRole &&
    !studentLike
  ) {
    redirect(
      destinations[existingRole] ||
        "/student",
    );
  }

  const advancedGrade =
    advanceGradeForAcademicYear(
      existing?.grade_number,
      existing?.grade_academic_year,
    );

  if (
    advancedGrade &&
    advancedGrade !==
      existing?.grade_number
  ) {
    await supabase
      .from("profiles")
      .update({
        grade_number:
          advancedGrade,
        grade_academic_year:
          currentAcademicYear(),
        onboarding_updated_at:
          new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  if (
    studentLike &&
    existing?.onboarding_completed &&
    advancedGrade
  ) {
    redirect(
      existingRole === "child"
        ? "/child"
        : "/student",
    );
  }

  const metadata =
    user.user_metadata ?? {};

  const metadataName =
    typeof metadata.full_name ===
    "string"
      ? metadata.full_name.trim()
      : typeof metadata.name ===
          "string"
        ? metadata.name.trim()
        : "";

  const metadataRole =
    typeof metadata.role === "string"
      ? metadata.role
          .trim()
          .toLowerCase()
      : "student";

  const requestHeaders =
    await headers();

  const googleCountry =
    countryCandidate(
      metadata.country ??
        metadata.country_code ??
        metadata.locale_country,
    );

  const edgeCountry =
    countryCandidate(
      requestHeaders.get(
        "cf-ipcountry",
      ) ??
        requestHeaders.get(
          "x-vercel-ip-country",
        ),
    );

  const savedCountry =
    countryCandidate(
      existing?.country,
    );

  const detectedCountry =
    [
      googleCountry,
      edgeCountry,
      savedCountry,
      "BH",
    ].find(isCountryCode) ?? "BH";

  const detectedSource =
    isCountryCode(googleCountry)
      ? "google"
      : isCountryCode(edgeCountry)
        ? "cloudflare"
        : savedCountry
          ? "saved"
          : "default";

  return (
    <AuthShell
      title="عرّفنا بك قليلًا"
      description="نستخدم صفك واهتماماتك لنجعل لوحة الطالب تبدأ من الدروس المناسبة لك، بينما تبقى بوابة المناهج كاملة ومفتوحة."
    >
      <ProfileOnboardingForm
        defaultName={
          existing?.full_name?.trim() ||
          metadataName ||
          user.email?.split("@")[0] ||
          ""
        }
        defaultRole={
          allowedRoles.has(
            existingRole ||
              metadataRole,
          )
            ? (existingRole ||
                metadataRole) as
                | "student"
                | "child"
                | "teacher"
                | "parent"
                | "school"
            : "student"
        }
        defaultCountry={
          detectedCountry
        }
        countryDetectedBy={
          detectedSource
        }
        defaultGrade={
          advancedGrade ??
          undefined
        }
        defaultInterests={
          Array.isArray(
            existing?.interests,
          )
            ? existing.interests
            : []
        }
        defaultLearningGoal={
          existing?.learning_goal ??
          ""
        }
        defaultLearningStyle={
          existing?.preferred_learning_style ??
          ""
        }
      />
    </AuthShell>
  );
}
