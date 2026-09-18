import { NextResponse } from "next/server";

import {
  aiConfigSummary,
} from "@/lib/ai/provider-router";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...aiConfigSummary(),
    note: "لا يتم كشف أي مفتاح؛ المعروض هو العدد فقط.",
  });
}
