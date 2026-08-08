import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { loadLessonChat } from "@/features/semantic-search/services/loadLessonChat";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const lessonId = searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const history = await loadLessonChat({
      supabase,
      studentId: user.id,
      lessonId,
    });

    return NextResponse.json({
      history,
    });
  } catch (error) {
    console.error(
      "LOAD_LESSON_CHAT_FAILED",
      error
    );

    return NextResponse.json(
      { error: "Failed." },
      { status: 500 }
    );
  }
}
