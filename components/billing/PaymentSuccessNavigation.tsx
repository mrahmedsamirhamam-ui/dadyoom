"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BillingStatus = {
  authenticated?: boolean;
  dashboardHref?: string;
  dashboardLabel?: string;
};

export default function PaymentSuccessNavigation() {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/billing/status", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as BillingStatus;
      })
      .then((payload) => {
        if (!cancelled) setStatus(payload);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav
      aria-label="العودة بعد الدفع"
      className="mt-6 flex flex-wrap justify-center gap-3"
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-2xl border border-[#d4c39d] bg-white px-5 py-3 font-black text-[#5f564a]"
      >
        ← رجوع
      </button>

      {status?.authenticated &&
      status.dashboardHref ? (
        <Link
          href={status.dashboardHref}
          prefetch={false}
          className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white"
        >
          {status.dashboardLabel || "لوحتي"}
        </Link>
      ) : (
        <Link
          href="/"
          prefetch={false}
          className="dadyoom-arabic-button rounded-2xl px-5 py-3 font-black text-white"
        >
          الصفحة الرئيسية
        </Link>
      )}

      <Link
        href="/courses/video-library"
        prefetch={false}
        className="rounded-2xl border border-[#c8a65d] bg-[#fff8e6] px-5 py-3 font-black text-[#71551e]"
      >
        مكتبة الفيديوهات
      </Link>

      <Link
        href="/pricing"
        prefetch={false}
        className="rounded-2xl border border-[#d4c39d] bg-white px-5 py-3 font-black text-[#123f39]"
      >
        ضاديوم Plus
      </Link>
    </nav>
  );
}
