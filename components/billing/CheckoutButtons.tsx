"use client";

import PaddleCheckout from "@/components/billing/PaddleCheckout";

export default function CheckoutButtons({
  kind,
}: {
  kind: "plus" | "course";
  courseId?: string;
}) {
  if (kind === "plus") {
    return <PaddleCheckout />;
  }

  return (
    <div className="rounded-2xl border border-[#d9c08b] bg-white p-4 text-center">
      <div className="font-black text-[#123f39]">
        شراء الدورات سيأتي في مرحلة السوق
      </div>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#746a5e]">
        الدفع الحالي مخصص لاشتراك ضاديوم Plus فقط.
      </p>
    </div>
  );
}
