import {
  createClient as createAdminClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

const PLUS_MONTHLY_PRICE_CAP_USD = 10.000;

function admin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_REQUIRED");
  }

  return createAdminClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function offerFor(params: {
  kind: "plus" | "course";
  courseId?: string;
}) {
  const db = admin();

  if (params.kind === "plus") {
    const { data, error } = await db
      .from("edu_subscription_plans")
      .select("id,name_ar,monthly_price,currency")
      .eq("id", "plus")
      .single();

    if (error || !data) {
      throw error ?? new Error("PLUS_PLAN_NOT_FOUND");
    }

    const amount = Number(data.monthly_price);
    const currency = String(data.currency).toUpperCase();

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      currency !== "USD" ||
      amount > PLUS_MONTHLY_PRICE_CAP_USD
    ) {
      throw new Error("PLUS_MONTHLY_PRICE_SAFETY_CAP");
    }

    return {
      amount,
      currency,
      description: `${String(data.name_ar)} — اشتراك شهري`,
      planId: "plus",
      courseId: null,
    };
  }

  if (!params.courseId) {
    throw new Error("COURSE_ID_REQUIRED");
  }

  const { data, error } = await db
    .from("edu_marketplace_courses")
    .select("id,title,price,currency,status")
    .eq("id", params.courseId)
    .eq("status", "published")
    .single();

  if (error || !data) {
    throw error ?? new Error("COURSE_NOT_FOUND");
  }

  return {
    amount: Number(data.price),
    currency: String(data.currency),
    description: String(data.title),
    planId: null,
    courseId: String(data.id),
  };
}

export async function createPaymentRecord(params: {
  buyerId: string;
  kind: "plus" | "course";
  provider: "paypal" | "bank" | "tap";
  amount: number;
  currency: string;
  planId?: string | null;
  courseId?: string | null;
  providerOrderId?: string | null;
  bankReference?: string | null;
  paymentMethod?: string | null;
}) {
  const db = admin();

  const { data, error } = await db
    .from("edu_payment_orders")
    .insert({
      buyer_id: params.buyerId,
      kind: params.kind,
      provider: params.provider,
      amount: params.amount,
      currency: params.currency,
      plan_id: params.planId ?? null,
      course_id: params.courseId ?? null,
      provider_order_id: params.providerOrderId ?? null,
      bank_reference: params.bankReference ?? null,
      payment_method: params.paymentMethod ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("PAYMENT_RECORD_FAILED");
  }

  return String(data.id);
}

export async function finalizePaymentOrder(orderId: string) {
  const db = admin();

  const { data: order, error } = await db
    .from("edu_payment_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw error ?? new Error("PAYMENT_ORDER_NOT_FOUND");
  }

  if (order.status === "completed") {
    return order;
  }

  if (order.kind === "plus") {
    const { data: existing } = await db
      .from("edu_subscriptions")
      .select("current_period_end")
      .eq("user_id", order.buyer_id)
      .maybeSingle();

    const now = new Date();
    const currentEnd = existing?.current_period_end
      ? new Date(existing.current_period_end)
      : null;

    const start = currentEnd && currentEnd > now ? currentEnd : now;
    const nextEnd = new Date(start);
    const originalDay = nextEnd.getUTCDate();

    nextEnd.setUTCDate(1);
    nextEnd.setUTCMonth(nextEnd.getUTCMonth() + 1);

    const lastDayOfTargetMonth = new Date(
      Date.UTC(
        nextEnd.getUTCFullYear(),
        nextEnd.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();

    nextEnd.setUTCDate(
      Math.min(originalDay, lastDayOfTargetMonth),
    );

    const { error: subscriptionError } = await db
      .from("edu_subscriptions")
      .upsert(
        {
          user_id: order.buyer_id,
          plan_id: "plus",
          status: "active",
          provider: order.provider,
          current_period_start: now.toISOString(),
          current_period_end: nextEnd.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (subscriptionError) throw subscriptionError;
  }

  if (order.kind === "course" && order.course_id) {
    const { data: course, error: courseError } = await db
      .from("edu_marketplace_courses")
      .select("id,teacher_id,commission_bps")
      .eq("id", order.course_id)
      .single();

    if (courseError || !course) {
      throw courseError ?? new Error("COURSE_NOT_FOUND");
    }

    const { data: purchase, error: purchaseError } = await db
      .from("edu_marketplace_purchases")
      .upsert(
        {
          buyer_id: order.buyer_id,
          course_id: order.course_id,
          payment_order_id: order.id,
          amount_paid: order.amount,
          currency: order.currency,
          status: "active",
        },
        {
          onConflict: "buyer_id,course_id",
        },
      )
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      throw purchaseError ?? new Error("PURCHASE_FAILED");
    }

    const fee = Number(
      (
        Number(order.amount) *
        (Number(course.commission_bps ?? 1500) / 10000)
      ).toFixed(3),
    );

    const net = Number((Number(order.amount) - fee).toFixed(3));

    const { error: earningError } = await db
      .from("edu_teacher_earnings")
      .upsert(
        {
          teacher_id: course.teacher_id,
          course_id: order.course_id,
          purchase_id: purchase.id,
          gross_amount: order.amount,
          platform_fee: fee,
          net_amount: net,
          currency: order.currency,
          status: "available",
        },
        {
          onConflict: "purchase_id",
        },
      );

    if (earningError) throw earningError;
  }

  const { data: completed, error: completeError } = await db
    .from("edu_payment_orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (completeError || !completed) {
    throw completeError ?? new Error("PAYMENT_FINALIZE_FAILED");
  }

  return completed;
}
