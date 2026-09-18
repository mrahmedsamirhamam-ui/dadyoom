type TapCharge = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  transaction?: {
    url?: string;
  };
  source?: {
    payment_method?: string;
    id?: string;
  };
};

type TapToken = {
  id: string;
  status?: string;
  card?: {
    brand?: string;
    scheme?: string;
  };
  payment?: {
    scheme?: string;
  };
};

type TapDestination = {
  id: string;
  amount: number;
  currency: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }

  return value;
}

function tapSecret() {
  return requiredEnv("TAP_SECRET_KEY");
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
    "http://localhost:3000"
  );
}

export function normalizeTapPaymentMethod(value: unknown) {
  const method = String(value ?? "").trim().toUpperCase();

  if (method.includes("VISA")) return "visa" as const;
  if (method.includes("MASTER")) return "mastercard" as const;

  return null;
}

export async function retrieveTapToken(tokenId: string) {
  if (!/^tok_[A-Za-z0-9_-]+$/u.test(tokenId)) {
    throw new Error("INVALID_TAP_TOKEN");
  }

  const response = await fetch(
    `https://api.tap.company/v2/tokens/${encodeURIComponent(tokenId)}`,
    {
      headers: {
        Authorization: `Bearer ${tapSecret()}`,
        accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as TapToken;

  if (!response.ok || !payload.id) {
    throw new Error(`TAP_TOKEN_RETRIEVE_${response.status}`);
  }

  return payload;
}

export async function verifiedTapCardMethod(tokenId: string) {
  const token = await retrieveTapToken(tokenId);

  const method = normalizeTapPaymentMethod(
    token.card?.brand ?? token.card?.scheme ?? token.payment?.scheme,
  );

  if (!method) {
    throw new Error("DADYOOM_ACCEPTS_VISA_MASTERCARD_ONLY");
  }

  return method;
}

export async function createTapCharge(params: {
  amount: number;
  currency: string;
  paymentOrderId: string;
  description: string;
  sourceId: string;
  customer: {
    name?: string | null;
    email?: string | null;
  };
  destination?: TapDestination | null;
}) {
  const secret = tapSecret();
  const merchantId = requiredEnv("TAP_MERCHANT_ID");
  const fullName = String(params.customer.name ?? "")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);

  const firstName = fullName[0] || "Dadyoom";
  const lastName = fullName.slice(1).join(" ") || "Customer";
  const base = siteUrl();

  const body: Record<string, unknown> = {
    amount: Number(params.amount.toFixed(3)),
    currency: params.currency,
    customer_initiated: true,
    threeDSecure: true,
    save_card: false,
    description: params.description.slice(0, 180),
    reference: {
      transaction: `dadyoom-${params.paymentOrderId}`,
      order: params.paymentOrderId,
    },
    metadata: {
      dadyoom_payment_order_id: params.paymentOrderId,
    },
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: params.customer.email || undefined,
    },
    merchant: {
      id: merchantId,
    },
    source: {
      id: params.sourceId,
    },
    post: {
      url: `${base}/api/payments/tap/webhook`,
    },
    redirect: {
      url: `${base}/payments/tap/return`,
    },
  };

  if (params.destination) {
    body.destinations = {
      destination: [
        {
          id: params.destination.id,
          amount: Number(params.destination.amount.toFixed(3)),
          currency: params.destination.currency,
        },
      ],
    };
  }

  const response = await fetch(
    "https://api.tap.company/v2/charges/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        accept: "application/json",
        lang_code: "ar",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as TapCharge & {
    errors?: unknown;
  };

  if (!response.ok || !payload.id) {
    throw new Error(
      `TAP_CREATE_${response.status}:${JSON.stringify(payload).slice(0, 500)}`,
    );
  }

  return payload;
}

export async function retrieveTapCharge(chargeId: string) {
  const response = await fetch(
    `https://api.tap.company/v2/charges/${encodeURIComponent(chargeId)}`,
    {
      headers: {
        Authorization: `Bearer ${tapSecret()}`,
        accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as TapCharge;

  if (!response.ok || !payload.id) {
    throw new Error(
      `TAP_RETRIEVE_${response.status}:${JSON.stringify(payload).slice(0, 500)}`,
    );
  }

  return payload;
}
