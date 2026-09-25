"use client";

export default function CheckoutButtons({
  kind,
}: {
  kind: "plus" | "course";
  courseId?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d9c08b] bg-white p-4 text-center">
      <div className="font-black text-[#123f39]">
        الدفع غير مفعّل حاليًا
      </div>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#746a5e]">
        {kind === "plus"
          ? "استمر بالخطة المجانية أو فترة الترحيب. تفعيل Plus المدفوع سيأتي لاحقًا."
          : "شراء الدورات غير مفعّل في المرحلة الحالية من ضاديوم."}
      </p>
    </div>
  );
}
