import { NextResponse } from "next/server";

import {
  avatarEngineStatus,
} from "@/lib/video/avatar-engine";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(avatarEngineStatus());
}
