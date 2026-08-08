"use client";

type LessonProgressProps = {
  progress: number;
};

export default function LessonProgress({
  progress,
}: LessonProgressProps) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex justify-between text-sm font-semibold">
        <span>تقدم الدرس</span>
        <span>{progress}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}