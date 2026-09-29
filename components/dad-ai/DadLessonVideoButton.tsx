"use client";

export default function DadLessonVideoButton({
  lessonTitle,
}: {
  lessonTitle: string;
}) {
  return (
    <div className="mb-3 rounded-2xl border border-[#d8c493] bg-[#fff8e8] p-3">
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="قريبًا"
        className="w-full cursor-not-allowed rounded-xl bg-[#123f39] px-4 py-2.5 text-sm font-black text-white opacity-70"
      >
        إنشاء فيديو الدرس بالـ AI — قريبًا
      </button>

      <p className="mt-2 text-[10px] font-bold leading-5 text-[#8a7650]">
        نختبر حاليًا محرك فيديو أسرع وأكثر استقرارًا قبل إتاحة الميزة للطلاب.
      </p>

      {lessonTitle ? (
        <p className="mt-1 text-[10px] leading-5 text-[#9b875f]">
          الدرس: {lessonTitle}
        </p>
      ) : null}
    </div>
  );
}
