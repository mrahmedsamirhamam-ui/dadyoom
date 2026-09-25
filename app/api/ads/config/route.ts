import { NextResponse } from "next/server";

function adsenseClient() {
  const candidate =
    process.env.ADSENSE_CLIENT?.trim() ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
    "";

  return /^ca-pub-\d{16}$/u.test(candidate)
    ? candidate
    : "";
}

export async function GET() {
  return NextResponse.json(
    {
      client: adsenseClient(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
