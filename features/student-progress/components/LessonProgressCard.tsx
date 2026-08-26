type Progress = {
  status: string;
  progress_percent: number;
  best_score: number;
  xp: number;
};

type Props = {
  progress: Progress | null;
};

export default function LessonProgressCard({
  progress,
}: Props) {
  if (!progress) {
    return (
      <div className="rounded-xl border p-6">
        <h3 className="text-lg font-bold">
          لم تبدأ هذا الدرس بعد
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border p-6">
      <p>
        <strong>الحالة:</strong>{" "}
        {progress.status}
      </p>

      <p>
        <strong>التقدم:</strong>{" "}
        {progress.progress_percent}%
      </p>

      <p>
        <strong>أفضل نتيجة:</strong>{" "}
        {progress.best_score}%
      </p>

      <p>
        <strong>النقاط:</strong>{" "}
        {progress.xp} XP
      </p>
    </div>
  );
}
