"use client";

import PaddleCheckout from "@/components/billing/PaddleCheckout";
import TapCardCheckout from "@/components/billing/TapCardCheckout";

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

  // Marketplace payments remain separated from the Plus subscription flow.
  // Tap stays available in code for marketplace work if it is activated later.
  return <TapCardCheckout kind={kind} courseId={courseId} />;
}
