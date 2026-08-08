"use client";

type Props = {
  score: number;
  total: number;
};

export default function ScoreCard({
  score,
  total,
}: Props) {
  const percentage =
    Math.round((score / total) * 100);

  return (
    <section className="rounded-3xl bg-gradient-to-r from-emerald-600 to-green-500 p-6 text-white shadow-lg">
      <h2 className="text-2xl font-bold">
        نتيجتك
      </h2>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-5xl font-bold">
            {score}/{total}
          </p>

          <p className="mt-2 text-emerald-100">
            {percentage}%
          </p>
        </div>

        <div className="text-7xl">
          {percentage >= 90
            ? "🏆"
            : percentage >= 70
            ? "🎉"
            : "💪"}
        </div>
      </div>
    </section>
  );
}