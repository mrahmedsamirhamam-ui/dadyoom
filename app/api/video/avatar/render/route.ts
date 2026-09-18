import {
  NextResponse,
} from "next/server";

import {
  consumeFeature,
} from "@/lib/billing/access";
import {
  createClient,
} from "@/lib/supabase/server";
import {
  renderAvatarVideo,
} from "@/lib/video/avatar-engine";

export const runtime = "nodejs";

export async function POST(
  request: Request,
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول.",
        },
        {
          status: 401,
        },
      );
    }

    const body =
      (await request.json()) as {
        imageUrl?: string;
        audioUrl?: string;
        text?: string;
        title?: string;
      };

    const imageUrl =
      String(
        body.imageUrl ?? "",
      ).trim();

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "صورة الشخصية غير محددة.",
        },
        {
          status: 400,
        },
      );
    }

    const access =
      await consumeFeature(
        "video_ai",
      );

    if (!access.allowed) {
      return NextResponse.json(
        {
          error:
            `استخدمت فيديوهات AI المسموحة اليوم (${access.limit}).`,
          remaining:
            access.remaining,
          plan:
            access.plan,
        },
        {
          status: 429,
        },
      );
    }

    const result =
      await renderAvatarVideo({
        imageUrl,
        audioUrl:
          body.audioUrl,
        text:
          body.text,
        title:
          body.title,
      });

    return NextResponse.json(
      result,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "تعذر إنشاء فيديو الشخصية.",
      },
      {
        status: 500,
      },
    );
  }
}
