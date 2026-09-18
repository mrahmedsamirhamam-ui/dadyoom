type PayPalLink = {
  href: string;
  rel: string;
  method?: string;
};

type PayPalOrder = {
  id: string;
  status: string;
  links?: PayPalLink[];
};

function baseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function accessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !secret) {
    throw new Error("PAYPAL_NOT_CONFIGURED");
  }

  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PAYPAL_AUTH_${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("PAYPAL_TOKEN_MISSING");
  }

  return payload.access_token;
}

export async function createPayPalOrder(params: {
  amount: number;
  currency: string;
  reference: string;
  description: string;
}) {
  const token = await accessToken();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/u, "") ||
    "http://localhost:3000";

  const response = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": params.reference,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.reference,
          description: params.description.slice(0, 120),
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(3),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: `${siteUrl}/payments/paypal/return`,
            cancel_url: `${siteUrl}/pricing?paypal=cancelled`,
          },
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `PAYPAL_CREATE_${response.status}:${detail.slice(0, 300)}`,
    );
  }

  const order = (await response.json()) as PayPalOrder;
  const approval =
    order.links?.find((link) => link.rel === "payer-action") ??
    order.links?.find((link) => link.rel === "approve");

  if (!order.id || !approval?.href) {
    throw new Error("PAYPAL_APPROVAL_LINK_MISSING");
  }

  return {
    id: order.id,
    approvalUrl: approval.href,
    status: order.status,
  };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await accessToken();

  const response = await fetch(
    `${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `capture-${orderId}`,
      },
      body: "{}",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text();

    throw new Error(
      `PAYPAL_CAPTURE_${response.status}:${detail.slice(0, 300)}`,
    );
  }

  return (await response.json()) as {
    id: string;
    status: string;
  };
}
