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

function credentialEnvironment(
  clientToken: string,
  apiKey: string,
) {
  const client =
    clientToken.startsWith(
      "live_",
    )
      ? "production"
      : clientToken.startsWith(
            "test_",
          )
        ? "sandbox"
        : "unknown";

  const server =
    apiKey.startsWith(
      "pdl_live_apikey_",
    )
      ? "production"
      : apiKey.startsWith(
            "pdl_sdbx_apikey_",
          )
        ? "sandbox"
        : "unknown";

  return {
    client,
    server,
  };
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

  const paddleClientToken =
    envValue(
      "PADDLE_CLIENT_TOKEN",
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
    );
  const paddleApiKey =
    envValue(
      "PADDLE_API_KEY",
    );
  const detected =
    credentialEnvironment(
      paddleClientToken,
      paddleApiKey,
    );

  const credentialsMatchEnvironment =
    detected.client ===
      paddleEnvironment &&
    (
      detected.server ===
        "unknown" ||
      detected.server ===
        paddleEnvironment
    );

  const paddle = {
    environment:
      paddleEnvironment,
    clientToken:
      Boolean(
        paddleClientToken,
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
        paddleApiKey,
      ),
    webhookSecret:
      Boolean(
        envValue(
          "PADDLE_WEBHOOK_SECRET",
        ),
      ),
    credentialsMatchEnvironment,
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
          paddle.webhookSecret &&
          paddle.credentialsMatchEnvironment,
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
