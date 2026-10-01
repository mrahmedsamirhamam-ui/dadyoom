"use client";

import CourseCheckoutButton from "@/components/billing/CourseCheckoutButton";
import PaddleCheckout from "@/components/billing/PaddleCheckout";

export default function CheckoutButtons({
  kind,
  courseId,
}: {
  kind: "plus" | "course";
  courseId?: string;
}) {
  if (kind === "plus") {
    return <PaddleCheckout />;
  }

  if (!courseId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center font-bold text-amber-800">
        تعذر تحديد الدورة.
      </div>
    );
  }

  return <CourseCheckoutButton courseId={courseId} />;
}
