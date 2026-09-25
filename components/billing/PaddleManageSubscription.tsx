"use client";

import { useEffect, useState } from "react";

type ManagePayload = {
  managedByPaddle?: boolean;
  trial?: boolean;
  currentPeriodEnd?: string | null;
  nextBilledAt?: string | null;
  updatePaymentMethodUrl?: string | null;
  cancelUrl?: string | null;
  error?: string;
  message?: string;
};

function dateLabel(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
  }).format(date);
}

export default function PaddleManageSubscription() {
  const [data, setData] = useState<ManagePayload | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/payments/paddle/manage", {
      cache: "no-store",
    })
      .then(async (response) => {
        const payload =
          (await response.json()) as ManagePayload;

        if (!response.ok) {
          throw new Error(
            payload.message ??
              "تعذر تحميل إدارة الاشتراك.",
          );
        }

        if (!cancelled) {
          setData(payload);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setData({
            error: "MANAGE_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "تعذر تحميل إدارة الاشتراك.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl bg-[#eaf6f0] p-4 font-black text-[#123f39]">
        جارٍ تحميل حالة Plus...
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-2xl bg-[#fff6df] p-4 text-sm font-bold leading-7 text-[#72551c]">
        {data.message}
      </div>
    );
  }

  if (data.trial) {
    const end = dateLabel(data.currentPeriodEnd);

    return (
      <div className="rounded-2xl bg-[#eaf6f0] p-4 font-black leading-7 text-[#123f39]">
        تجربة Plus الترحيبية فعّالة الآن
        {end ? ` حتى ${end}` : ""}.
      </div>
    );
  }

  if (!data.managedByPaddle) {
    return (
      <div className="rounded-2xl bg-[#eaf6f0] p-4 font-black text-[#123f39]">
        حسابك Plus فعّال.
      </div>
    );
  }

  const renewal = dateLabel(data.nextBilledAt);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-[#eaf6f0] p-4 font-black leading-7 text-[#123f39]">
        حسابك Plus فعّال
        {renewal ? ` — التجديد المتوقع ${renewal}` : ""}.
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {data.updatePaymentMethodUrl ? (
          <a
            href={data.updatePaymentMethodUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#d6b569] bg-white px-4 py-3 text-center font-black text-[#72551c]"
          >
            تحديث وسيلة الدفع
          </a>
        ) : null}

        {data.cancelUrl ? (
          <a
            href={data.cancelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#e4b2a9] bg-white px-4 py-3 text-center font-black text-[#8a3d31]"
          >
            إدارة / إلغاء الاشتراك
          </a>
        ) : null}
      </div>
    </div>
  );
}
