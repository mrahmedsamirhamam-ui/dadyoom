import { NextResponse } from "next/server";

import {
  createDadyoomLiveToken,
  livekitConfigured,
} from "@/lib/livekit/server";
import { createClient } from "@/lib/supabase/server";
import { authorizeSession } from "@/lib/auth/authorization";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const access = await authorizeSession(supabase);
    if (!access.ok) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول." },
        { status: access.status },
      );
    }
    const { user } = access;

    if (!livekitConfigured()) {
      return NextResponse.json(
        {
          error:
            "خادم الحصص المباشرة لم يتم ربطه بعد.",
          configured: false,
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      sessionId?: string;
    };

    const sessionId = String(
      body.sessionId ?? "",
    ).trim();

    if (!sessionId) {
      return NextResponse.json(
        { error: "الحصة غير محددة." },
        { status: 400 },
      );
    }

    const {
      data: allowed,
      error: accessError,
    } = await supabase.rpc(
      "edu_can_join_live_session",
      {
        p_session: sessionId,
        p_user: user.id,
      },
    );

    if (accessError || allowed !== true) {
      return NextResponse.json(
        {
          error:
            "ليس لديك صلاحية لدخول هذه الحصة.",
        },
        { status: 403 },
      );
    }

    const {
      data: session,
      error,
    } = await supabase
      .from("edu_live_sessions")
      .select("id,teacher_id,room_name,title")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !session) {
      return NextResponse.json(
        { error: "الحصة غير موجودة." },
        { status: 404 },
      );
    }

    const isTeacher =
      session.teacher_id === user.id;

    const token =
      await createDadyoomLiveToken({
        room: session.room_name,
        identity: user.id,
        name: String(
          user.user_metadata?.full_name ??
            user.email ??
            "Dadyoom user",
        ).slice(0, 100),
        isTeacher,
      });

    await supabase
      .from("edu_live_attendance")
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          role: isTeacher ? "teacher" : "student",
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "session_id,user_id",
        },
      );

    return NextResponse.json({
      token,
      serverUrl: process.env.LIVEKIT_URL,
      roomName: session.room_name,
      title: session.title,
      isTeacher,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر دخول الحصة.",
      },
      { status: 500 },
    );
  }
}
