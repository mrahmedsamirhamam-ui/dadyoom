import { NextResponse } from "next/server";

import {
  authorizeSession,
} from "@/lib/auth/authorization";
import {
  livekitConfigured,
} from "@/lib/livekit/server";
import {
  createClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function envValue(
  ...names: string[]
) {
  for (const name of names) {
    const value =
      process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function validAdsenseClient() {
  const client =
    envValue(
      "ADSENSE_CLIENT",
      "NEXT_PUBLIC_ADSENSE_CLIENT",
    );

  return /^ca-pub-\d{16}$/u.test(
    client,
  );
}

export async function GET() {
  const supabase =
    await createClient();

  const access =
    await authorizeSession(
      supabase,
      ["admin"],
    );

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.error,
      },
      {
        status:
          access.status,
      },
    );
  }

  const paddleEnvironment =
    envValue(
      "PADDLE_ENVIRONMENT",
    ).toLowerCase() ===
      "production"
      ? "production"
      : "sandbox";

  const paddle = {
    environment:
      paddleEnvironment,
    clientToken:
      Boolean(
        envValue(
          "PADDLE_CLIENT_TOKEN",
          "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
        ),
      ),
    priceId:
      Boolean(
        envValue(
          "PADDLE_PLUS_PRICE_ID",
          "NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID",
        ),
      ),
    apiKey:
      Boolean(
        envValue(
          "PADDLE_API_KEY",
        ),
      ),
    webhookSecret:
      Boolean(
        envValue(
          "PADDLE_WEBHOOK_SECRET",
        ),
      ),
  };

  return NextResponse.json(
    {
      ok: true,
      live: {
        provider:
          "livekit",
        configured:
          livekitConfigured(),
      },
      adsense: {
        configured:
          validAdsenseClient(),
      },
      paddle: {
        ...paddle,
        configured:
          paddle.clientToken &&
          paddle.priceId &&
          paddle.apiKey &&
          paddle.webhookSecret,
      },
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}
