import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = rawId.trim();

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: "معرّف الدرس غير صالح." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !lesson) {
    return NextResponse.json(
      { error: "الدرس غير موجود أو غير منشور." },
      { status: 404 },
    );
  }

  const targetUrl = getSiteUrl() + "/q/" + id;

  const qrResponse = await fetch("https://quickchart.io/qr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: targetUrl,
      size: 720,
      format: "png",
      margin: 4,
      dark: "123f39",
      light: "ffffff",
      ecLevel: "M",
    }),
  });

  if (!qrResponse.ok) {
    console.error("SMART_QR_RENDER_FAILED", {
      lessonId: id,
      status: qrResponse.status,
    });

    return NextResponse.json(
      { error: "تعذر إنشاء رمز QR الآن." },
      { status: 502 },
    );
  }

  const bytes = await qrResponse.arrayBuffer();
  const download =
    new URL(request.url).searchParams.get("download") === "1";

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Disposition": download
        ? 'attachment; filename="dadyoom-lesson-' + id + '-qr.png"'
        : "inline",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
