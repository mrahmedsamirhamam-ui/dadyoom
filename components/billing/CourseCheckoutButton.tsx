"use client";

import { useState } from "react";

type BpayOrder = {
  paymentOrderId: string;
  status: "pending" | "approved";
  reference?: string | null;
  amount: number;
  currency: string;
  bpayMobile: string;
  bpayName?: string | null;
};

export default function CourseCheckoutButton({
  courseId,
}: {
  courseId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [order, setOrder] = useState<BpayOrder | null>(null);
  const [reference, setReference] = useState("");

  async function startBpay() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/bpay/create-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const payload = (await response.json()) as Partial<BpayOrder> & {
        message?: string;
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (
        !response.ok ||
        !payload.paymentOrderId ||
        !payload.bpayMobile ||
        typeof payload.amount !== "number" ||
        !payload.currency
      ) {
        setMessage(payload.message ?? "تعذر تجهيز طلب BPay الآن.");
        return;
      }

      const nextOrder: BpayOrder = {
        paymentOrderId: payload.paymentOrderId,
        status: payload.status === "approved" ? "approved" : "pending",
        reference: payload.reference ?? null,
        amount: payload.amount,
        currency: payload.currency,
        bpayMobile: payload.bpayMobile,
        bpayName: payload.bpayName ?? null,
      };

      setOrder(nextOrder);
      setReference(payload.reference ?? "");

      if (nextOrder.status === "approved") {
        setMessage("تم إرسال مرجع BPay بالفعل. ينتظر الطلب تأكيد المعلم.");
      }
    } catch {
      setMessage("تعذر الاتصال بخدمة الدفع الآن.");
    } finally {
      setLoading(false);
    }
  }

  async function submitReference() {
    if (!order || submitting || !reference.trim()) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/bpay/submit-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentOrderId: order.paymentOrderId,
          reference: reference.trim(),
        }),
      });

      const payload = (await response.json()) as {
        status?: string;
        message?: string;
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        setMessage(payload.message ?? "تعذر إرسال مرجع BPay.");
        return;
      }

      setOrder((current) =>
        current
          ? {
              ...current,
              status: "approved",
              reference: reference.trim(),
            }
          : current,
      );
      setMessage(
        payload.message ??
          "تم إرسال المرجع. ستُفتح الدورة بعد تأكيد المعلم استلام التحويل.",
      );
    } catch {
      setMessage("تعذر إرسال مرجع BPay الآن.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyMobile() {
    if (!order?.bpayMobile) return;

    try {
      await navigator.clipboard.writeText(order.bpayMobile);
      setMessage("تم نسخ رقم BPay.");
    } catch {
      setMessage("انسخ رقم BPay يدويًا.");
    }
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={startBpay}
          disabled={loading}
          className="w-full rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white transition hover:bg-[#0d312d] disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "جارٍ تجهيز الطلب..." : "الدفع عبر BPay"}
        </button>

        <p className="text-xs leading-6 text-[#746a5e]">
          الدفع يتم من تطبيق BPay مباشرة إلى المعلم. لا تُفتح الدورة إلا بعد إرسال مرجع العملية وتأكيد المعلم استلام المبلغ، وتُدار عمولة المنصة كتسوية مستقلة مع المعلم.
        </p>

        {message ? (
          <div className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
            {message}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-sm font-black text-emerald-800">
          بيانات الدفع عبر BPay
        </div>

        <div className="mt-3 grid gap-2 text-sm">
          <div>
            المبلغ:{" "}
            <b>
              {Number(order.amount).toFixed(3)} {order.currency}
            </b>
          </div>
          <div>
            اسم المستلم: <b>{order.bpayName || "معلم الدورة"}</b>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>
              رقم BPay: <b dir="ltr">{order.bpayMobile}</b>
            </span>
            <button
              type="button"
              onClick={copyMobile}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs font-black text-emerald-800"
            >
              نسخ الرقم
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs leading-6 text-emerald-900/80">
          افتح تطبيق BPay، أرسل المبلغ الموضح إلى الرقم أعلاه، ثم أدخل مرجع العملية الذي يظهر لك بعد نجاح التحويل.
        </p>
      </div>

      {order.status === "pending" ? (
        <div className="space-y-3">
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="مرجع عملية BPay"
            className="w-full rounded-2xl border p-3"
          />
          <button
            type="button"
            onClick={submitReference}
            disabled={submitting || !reference.trim()}
            className="w-full rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "جارٍ إرسال المرجع..." : "أرسلت المبلغ — إرسال المرجع"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#fff7e4] p-4 text-sm font-bold text-[#77561d]">
          تم إرسال مرجع BPay. الطلب الآن ينتظر أن يتحقق المعلم من وصول المبلغ ثم يفتح الدورة.
        </div>
      )}

      {message ? (
        <div className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
          {message}
        </div>
      ) : null}
    </div>
  );
}
