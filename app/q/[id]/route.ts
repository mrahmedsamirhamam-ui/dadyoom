import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
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
    const response = NextResponse.redirect(
      new URL("/courses?qr=invalid", request.url),
      307,
    );
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const supabase = await createClient();

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !lesson) {
    const response = NextResponse.redirect(
      new URL("/courses?qr=not-found", request.url),
      307,
    );
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const admin = createAdminClient();
    await admin.from("lesson_qr_scans").insert({
      lesson_id: id,
      user_id: user?.id ?? null,
      source: "printed_qr",
    });
  } catch (scanError) {
    console.warn(
      "SMART_QR_SCAN_LOG_WARNING",
      scanError instanceof Error ? scanError.message : String(scanError),
    );
  }

  const destination = new URL("/lessons/" + id, request.url);
  destination.searchParams.set("via", "qr");

  const response = NextResponse.redirect(destination, 307);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
