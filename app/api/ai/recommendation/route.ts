import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateStudentRecommendation } from "@/services/ai/dad-ai.service";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const recommendation =
      await generateStudentRecommendation(
        supabase,
        user.id,
        user.email
      );

    return NextResponse.json({
      success: true,
      recommendation,
      provider:
        process.env.AI_PROVIDER?.trim().toLowerCase() ||
        "mock",
      model:
        process.env.AI_PROVIDER?.trim().toLowerCase() ===
        "gemini"
          ? process.env.GEMINI_MODEL ?? null
          : null,
    });
  } catch (error) {
    console.error(
      "AI_RECOMMENDATION_ROUTE_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع.",
      },
      {
        status: 500,
      }
    );
  }
}