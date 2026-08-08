import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب تسجيل الدخول أولًا",
        },
        { status: 401 }
      );
    }

    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرّف الدرس غير موجود",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("student_progress")
      .insert({
        student_email: user.email,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      });

    // الرمز 23505 يعني أن السجل موجود سابقًا؛ نعتبر العملية ناجحة.
    if (error?.code === "23505") {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        message: "هذا الدرس مكتمل بالفعل",
      });
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyCompleted: false,
      message: "تم حفظ تقدمك بنجاح",
    });
  } catch (error) {
    console.error("Complete lesson error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ غير متوقع",
      },
      { status: 500 }
    );
  }
}