import { NextResponse } from "next/server";

import { billingStatus } from "@/lib/billing/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(
      await billingStatus(),
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "BILLING_STATUS_UNEXPECTED_ERROR",
      error instanceof Error
        ? error.message
        : String(error),
    );

    return NextResponse.json(
      {
        authenticated: false,
        role: null,
        dashboardHref: "/student",
        dashboardLabel: "لوحة الطالب",
        plan: "free",
        plus: false,
        showAds: false,
        degraded: true,
        limits: {},
        price: 0,
        currency: "BHD",
        plusPrice: 10,
        plusCurrency: "USD",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
