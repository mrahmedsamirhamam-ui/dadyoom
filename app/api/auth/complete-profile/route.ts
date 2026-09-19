import { NextResponse } from "next/server";

import { isCountryCode } from "@/lib/countries";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  currentAcademicYear,
} from "@/lib/student/academic-year";

const allowedRoles =
  new Set([
    "student",
    "child",
    "teacher",
    "parent",
    "school",
  ]);

const allowedStyles =
  new Set([
    "visual",
    "practice",
    "reading",
    "mixed",
    "",
  ]);

const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

type ProfileBody = {
  fullName?: unknown;
  role?: unknown;
  country?: unknown;
  gradeNumber?: unknown;
  interests?: unknown;
  learningGoal?: unknown;
  preferredLearningStyle?: unknown;
};

function cleanText(
  value: unknown,
  max: number,
): string {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function detectEdgeCountry(
  request: Request,
): string {
  const candidate =
    (
      request.headers.get(
        "cf-ipcountry",
      ) ??
      request.headers.get(
        "x-vercel-ip-country",
      ) ??
      ""
    )
      .trim()
      .toUpperCase();

  return isCountryCode(
    candidate,
  )
    ? candidate
    : "";
}

export async function POST(
  request: Request,
) {
  const supabase =
    await createClient();

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
    return NextResponse.json(
      {
        error:
          "يجب تسجيل الدخول أولًا.",
      },
      { status: 401 },
    );
  }

  let body: ProfileBody;

  try {
    body =
      (await request.json()) as
        ProfileBody;
  } catch {
    return NextResponse.json(
      {
        error:
          "بيانات الحساب غير صالحة.",
      },
      { status: 400 },
    );
  }

  const fullName =
    cleanText(
      body.fullName,
      120,
    );

  const role =
    cleanText(
      body.role,
      30,
    ).toLowerCase() ||
    "student";

  const manualCountry =
    cleanText(
      body.country,
      8,
    ).toUpperCase();

  const metadataCountry =
    cleanText(
      user.user_metadata?.country ??
        user.user_metadata?.country_code,
      8,
    ).toUpperCase();

  const edgeCountry =
    detectEdgeCountry(request);

  const country =
    [
      manualCountry,
      metadataCountry,
      edgeCountry,
      "BH",
    ].find(isCountryCode) ??
    "BH";

  const studentLike =
    role === "student" ||
    role === "child";

  const gradeNumber =
    Number(body.gradeNumber);

  const interests =
    Array.isArray(
      body.interests,
    )
      ? body.interests
          .filter(
            (
              item,
            ): item is string =>
              typeof item ===
              "string",
          )
          .map((item) =>
            item
              .trim()
              .slice(0, 50),
          )
          .filter(Boolean)
          .slice(0, 6)
      : [];

  const learningGoal =
    cleanText(
      body.learningGoal,
      160,
    );

  const preferredLearningStyle =
    cleanText(
      body.preferredLearningStyle,
      30,
    );

  if (!fullName) {
    return NextResponse.json(
      {
        error:
          "اكتب الاسم الكامل.",
      },
      { status: 400 },
    );
  }

  if (
    !allowedRoles.has(role)
  ) {
    return NextResponse.json(
      {
        error:
          "نوع الحساب غير صالح.",
      },
      { status: 400 },
    );
  }

  if (
    !isCountryCode(country)
  ) {
    return NextResponse.json(
      {
        error:
          "تعذر تحديد الدولة.",
      },
      { status: 400 },
    );
  }

  if (
    studentLike &&
    (
      !Number.isInteger(
        gradeNumber,
      ) ||
      gradeNumber < 1 ||
      gradeNumber > 12
    )
  ) {
    return NextResponse.json(
      {
        error:
          "اختر صفًا دراسيًا صحيحًا.",
      },
      { status: 400 },
    );
  }

  if (
    !allowedStyles.has(
      preferredLearningStyle,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "طريقة التعلم المختارة غير صالحة.",
      },
      { status: 400 },
    );
  }

  const countrySource =
    isCountryCode(
      manualCountry,
    )
      ? "manual"
      : isCountryCode(
            metadataCountry,
          )
        ? "google-metadata"
        : edgeCountry
          ? "cloudflare"
          : "default";

  const admin =
    createAdminClient();

  const payload = {
    id: user.id,
    email: user.email,
    full_name: fullName,
    role,
    country,
    grade_number:
      studentLike
        ? gradeNumber
        : null,
    interests:
      studentLike
        ? interests
        : [],
    learning_goal:
      studentLike &&
      learningGoal
        ? learningGoal
        : null,
    preferred_learning_style:
      studentLike &&
      preferredLearningStyle
        ? preferredLearningStyle
        : null,
    onboarding_completed:
      true,
    grade_academic_year:
      studentLike
        ? currentAcademicYear()
        : null,
    country_source:
      countrySource,
    onboarding_updated_at:
      new Date().toISOString(),
  };

  const { error: upsertError } =
    await admin
      .from("profiles")
      .upsert(
        payload,
        {
          onConflict: "id",
        },
      );

  if (upsertError) {
    console.error(
      "PROFILE_COMPLETION_ERROR:",
      upsertError.message,
    );

    return NextResponse.json(
      {
        error:
          "تعذر إكمال ملف الحساب.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      destination:
        destinations[role] ||
        "/student",
    },
    { status: 200 },
  );
}
