import { NextResponse } from "next/server";

import { billingStatus } from "@/lib/billing/access";

export async function GET() {
  return NextResponse.json(await billingStatus());
}
