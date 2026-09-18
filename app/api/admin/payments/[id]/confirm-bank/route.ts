import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { finalizePaymentOrder } from "@/lib/payments/orders";
import { authorizeSession } from "@/lib/auth/authorization";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const supabase = await createClient();
  const access = await authorizeSession(supabase, ["admin"]);
  if (!access.ok) {
    return NextResponse.json(
      { error: "غير مصرح." },
      { status: access.status },
    );
  }

  const { id } = await context.params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return NextResponse.json(
      { error: "Service role missing." },
      { status: 500 },
    );
  }

  const admin = createAdminClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: payment, error } = await admin
    .from("edu_payment_orders")
    .select("id,provider,status")
    .eq("id", id)
    .single();

  if (error || !payment || payment.provider !== "bank") {
    return NextResponse.json(
      { error: "طلب التحويل غير موجود." },
      { status: 404 },
    );
  }

  await finalizePaymentOrder(id);

  return NextResponse.json({ ok: true });
}
