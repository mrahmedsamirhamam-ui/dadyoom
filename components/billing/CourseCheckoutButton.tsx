"use client";

import { useState } from "react";

export default function CourseCheckoutButton({
  courseId,
}: {
  courseId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function checkout() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payments/paypal/create-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      const payload = (await response.json()) as {
        url?: string;
        message?: string;
        error?: string;
      };

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok || !payload.url) {
        setMessage(
          payload.message ??
            "تعذر فتح صفحة الدفع الآن.",
        );
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setMessage("تعذر الاتصال بـ PayPal Sandbox الآن.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className="w-full rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white transition hover:bg-[#0d312d] disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "جارٍ تجهيز الدفع..." : "شراء الدورة"}
      </button>

      <p className="text-xs leading-6 text-[#746a5e]">
        الاختبار الحالي عبر PayPal Sandbox فقط. بعد نجاح الاختبار تُفتح الدورة تلقائيًا، وتُسجَّل 15% عمولة لضاديوم و85% صافيًا للمعلم.
      </p>

      {message ? (
        <div className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">
          {message}
        </div>
      ) : null}
    </div>
  );
}
