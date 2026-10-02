"use client";

export default function CourseCheckoutButton({
  courseId: _courseId,
}: {
  courseId: string;
}) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white opacity-60"
      >
        الدفع للدورات قيد التفعيل
      </button>

      <p className="text-xs leading-6 text-[#746a5e]">
        يتم تجهيز مسار دفع مناسب للحسابات الفردية في البحرين. لن يتم تنفيذ أي دفع حقيقي قبل اكتمال التحقق.
      </p>
    </div>
  );
}
