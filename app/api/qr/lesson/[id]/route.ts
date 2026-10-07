import qrcode from "qrcode-generator";
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

  const targetUrl =
    getSiteUrl() + "/q/" + id;

  const qr = qrcode(0, "M");
  qr.addData(targetUrl);
  qr.make();

  const svg = qr
    .createSvgTag({
      cellSize: 12,
      margin: 48,
      scalable: true,
    })
    .replace(
      /fill="black"/gu,
      'fill="#123f39"',
    );

  const download =
    new URL(request.url).searchParams.get(
      "download",
    ) === "1";

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type":
        "image/svg+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800",
      "Content-Disposition": download
        ? 'attachment; filename="dadyoom-lesson-' +
          id +
          '-qr.svg"'
        : "inline",
      "X-Robots-Tag":
        "noindex, nofollow",
    },
  });
}
