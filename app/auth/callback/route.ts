import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isCountryCode } from "@/lib/countries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const roleDestinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

const studentRoles =
  new Set([
    "student",
    "child",
  ]);

function safeNext(
  value: string | null,
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  return value;
}

function parseIntent(
  raw: string | undefined,
) {
  if (!raw) return null;

  try {
    const json =
      Buffer.from(
        raw,
        "base64url",
      ).toString("utf8");

    const value =
      JSON.parse(json) as {
        fullName?: string;
        role?: string;
        country?: string;
      };

    const role =
      typeof value.role ===
      "string"
        ? value.role
            .trim()
            .toLowerCase()
        : "student";

    const country =
      typeof value.country ===
      "string"
        ? value.country
            .trim()
            .toUpperCase()
        : "";

    const fullName =
      typeof value.fullName ===
      "string"
        ? value.fullName
            .trim()
            .slice(0, 120)
        : "";

    if (
      !fullName ||
      !new Set([
        "student",
        "child",
        "teacher",
        "parent",
        "school",
      ]).has(role) ||
      !isCountryCode(
        country,
      )
    ) {
      return null;
    }

    return {
      fullName,
      role,
      country,
    };
  } catch {
    return null;
  }
}

function detectedCountry(
  request: Request,
  metadata: Record<string, unknown>,
  fallback = "",
): {
  code: string;
  source: string;
} {
  const candidates = [
    {
      value:
        typeof metadata.country ===
        "string"
          ? metadata.country
          : typeof metadata.country_code ===
              "string"
            ? metadata.country_code
            : "",
      source:
        "google-metadata",
    },
    {
      value:
        request.headers.get(
          "cf-ipcountry",
        ) ?? "",
      source:
        "cloudflare",
    },
    {
      value:
        request.headers.get(
          "x-vercel-ip-country",
        ) ?? "",
      source:
        "edge",
    },
    {
      value: fallback,
      source: "saved",
    },
    {
      value: "BH",
      source: "default",
    },
  ];

  for (const item of candidates) {
    const code =
      String(item.value)
        .trim()
        .toUpperCase();

    if (isCountryCode(code)) {
      return {
        code,
        source:
          item.source,
      };
    }
  }

  return {
    code: "BH",
    source: "default",
  };
}

function destinationForProfile(
  profile:
    | {
        role?: string | null;
        onboarding_completed?: boolean | null;
        grade_number?: number | null;
      }
    | null,
  requestedNext: string | null,
) {
  const role =
    profile?.role
      ?.trim()
      .toLowerCase() ||
    "student";

  const grade =
    Number(
      profile?.grade_number,
    );

  if (
    studentRoles.has(role) &&
    (
      profile?.onboarding_completed !==
        true ||
      !Number.isInteger(grade) ||
      grade < 1 ||
      grade > 12
    )
  ) {
    return "/onboarding";
  }

  return (
    requestedNext ||
    roleDestinations[role] ||
    "/student"
  );
}

export async function GET(
  request: Request,
) {
  const url =
    new URL(request.url);

  const code =
    url.searchParams.get("code");

  const requestedNext =
    safeNext(
      url.searchParams.get(
        "next",
      ),
    );

  const origin =
    url.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=oauth_callback",
        origin,
      ),
    );
  }

  const supabase =
    await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(
      code,
    );

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        "/login?error=oauth_exchange",
        origin,
      ),
    );
  }

  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user ||
    !user.email
  ) {
    return NextResponse.redirect(
      new URL(
        "/login?error=oauth_user",
        origin,
      ),
    );
  }

  const admin =
    createAdminClient();

  const {
    data: existingProfile,
  } =
    await admin
      .from("profiles")
      .select(
        "role,country,full_name,onboarding_completed,grade_number",
      )
      .eq("id", user.id)
      .maybeSingle();

  const cookieStore =
    await cookies();

  const intent =
    parseIntent(
      cookieStore.get(
        "dadyoom_oauth_intent",
      )?.value,
    );

  if (
    existingProfile?.role &&
    existingProfile?.full_name?.trim()
  ) {
    const detected =
      detectedCountry(
        request,
        user.user_metadata ?? {},
        existingProfile.country ??
          "",
      );

    if (
      !existingProfile.country
    ) {
      await admin
        .from("profiles")
        .update({
          country:
            detected.code,
          country_source:
            detected.source,
        })
        .eq("id", user.id);
    }

    const response =
      NextResponse.redirect(
        new URL(
          destinationForProfile(
            existingProfile,
            requestedNext,
          ),
          origin,
        ),
      );

    response.cookies.delete(
      "dadyoom_oauth_intent",
    );

    return response;
  }

  const metadata =
    user.user_metadata ?? {};

  const detected =
    detectedCountry(
      request,
      metadata,
      intent?.country ?? "",
    );

  const role =
    intent?.role ||
    (
      typeof metadata.role ===
      "string"
        ? metadata.role
            .trim()
            .toLowerCase()
        : "student"
    );

  const safeRole =
    new Set([
      "student",
      "child",
      "teacher",
      "parent",
      "school",
    ]).has(role)
      ? role
      : "student";

  const fullName =
    intent?.fullName ||
    (
      typeof metadata.full_name ===
      "string"
        ? metadata.full_name.trim()
        : ""
    ) ||
    (
      typeof metadata.name ===
      "string"
        ? metadata.name.trim()
        : ""
    ) ||
    user.email.split("@")[0];

  const country =
    intent?.country &&
    isCountryCode(
      intent.country,
    )
      ? intent.country
      : detected.code;

  const studentLike =
    studentRoles.has(
      safeRole,
    );

  const {
    error: profileError,
  } =
    await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name:
            fullName,
          role:
            safeRole,
          country,
          country_source:
            intent?.country
              ? "manual"
              : detected.source,
          onboarding_completed:
            !studentLike,
          onboarding_updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

  if (profileError) {
    console.error(
      "GOOGLE_PROFILE_INSERT_ERROR:",
      profileError.message,
    );

    return NextResponse.redirect(
      new URL(
        "/onboarding?error=profile_create",
        origin,
      ),
    );
  }

  const destination =
    studentLike
      ? "/onboarding"
      : (
          requestedNext ||
          roleDestinations[
            safeRole
          ] ||
          "/student"
        );

  const response =
    NextResponse.redirect(
      new URL(
        destination,
        origin,
      ),
    );

  response.cookies.delete(
    "dadyoom_oauth_intent",
  );

  return response;
}
