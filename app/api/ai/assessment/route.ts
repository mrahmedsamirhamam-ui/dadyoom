import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateAndSaveAssessment } from "@/services/ai/assessment.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          error:
            "يجب تسجيل الدخول لإنشاء تقييم ذكي.",
        },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const studentName =
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email.split("@")[0] ||
      "بطل ضاديوم";

    const result =
      await generateAndSaveAssessment(
        supabase,
        user.email,
        studentName
      );

    return NextResponse.json({
      success: true,
      assessment: result.assessment,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("AI_ASSESSMENT_ROUTE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء إنشاء التقييم.",
      },
      { status: 500 }
    );
  }
}
