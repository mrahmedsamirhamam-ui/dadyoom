import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

type TapWebhookCharge = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reference: { gateway: string; payment: string };
  transaction: { created: string | number };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseTapWebhookCharge(value: unknown): TapWebhookCharge | null {
  if (!isRecord(value) || !isRecord(value.transaction)) return null;
  const reference = value.reference ?? {};
  if (!isRecord(reference)) return null;
  const gateway = reference.gateway ?? "";
  const payment = reference.payment ?? "";
  const created = value.transaction.created;

  if (
    typeof value.id !== "string" || !/^chg_[A-Za-z0-9_-]+$/u.test(value.id) ||
    typeof value.amount !== "number" || !Number.isFinite(value.amount) ||
    value.amount <= 0 || value.amount >= 1e21 ||
    typeof value.currency !== "string" || !/^[A-Z]{3}$/u.test(value.currency) ||
    typeof value.status !== "string" || !/^[A-Z_]+$/u.test(value.status) ||
    typeof gateway !== "string" || typeof payment !== "string" ||
    !((typeof created === "string" && /^\d+$/u.test(created)) ||
      (typeof created === "number" && Number.isSafeInteger(created) && created > 0))
  ) return null;

  return {
    id: value.id,
    amount: value.amount,
    currency: value.currency,
    status: value.status,
    reference: { gateway, payment },
    transaction: { created },
  };
}

// Tap signs these charge fields, with the ISO currency precision, using TAP_SECRET_KEY.
// https://developers.tap.company/docs/webhook
export function verifyTapWebhookSignature(
  charge: TapWebhookCharge,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !/^[a-f0-9]{64}$/iu.test(signature)) return false;

  const decimals = new Intl.NumberFormat("en", {
    style: "currency", currency: charge.currency,
  }).resolvedOptions().maximumFractionDigits;
  const message = `x_id${charge.id}x_amount${charge.amount.toFixed(decimals)}` +
    `x_currency${charge.currency}x_gateway_reference${charge.reference.gateway}` +
    `x_payment_reference${charge.reference.payment}x_status${charge.status}` +
    `x_created${charge.transaction.created}`;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(Buffer.from(signature, "hex"), expected);
}
