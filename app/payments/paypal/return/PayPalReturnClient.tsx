"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PayPalReturnClient() {
  const [message, setMessage] = useState(
    "جارٍ تأكيد الدفع...",
  );

  useEffect(() => {
    const controller = new AbortController();

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("token");
    const paymentOrderId = params.get("paymentOrderId");

    if (!orderId || !paymentOrderId) {
      const timer = window.setTimeout(() => {
        setMessage("معرف PayPal غير موجود.");
      }, 0);

      return () => {
        window.clearTimeout(timer);
        controller.abort();
      };
    }

    async function capturePayment() {
      try {
        const response = await fetch(
          "/api/payments/paypal/capture-course",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              orderId,
              paymentOrderId,
            }),
            signal: controller.signal,
          },
        );

        const payload =
          (await response.json()) as {
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            payload.error ??
              "تعذر تأكيد الدفع.",
          );
        }

        setMessage(
          "تم تأكيد دفع PayPal Sandbox وتفعيل الدورة بنجاح.",
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setMessage(
          error instanceof Error
            ? error.message
            : "تعذر تأكيد الدفع.",
        );
      }
    }

    void capturePayment();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="dadyoom-arabic-surface min-h-screen px-4 py-14"
    >
      <div className="mx-auto max-w-xl rounded-[2rem] border bg-white p-7 text-center">
        <h1 className="text-2xl font-black text-[#123f39]">
          نتيجة الدفع
        </h1>

        <p className="mt-4 leading-8">
          {message}
        </p>

        <Link
          href="/student"
          className="dadyoom-arabic-button mt-6 inline-flex rounded-2xl px-5 py-3 font-black text-white"
        >
          العودة إلى ضاديوم
        </Link>
      </div>
    </main>
  );
}
