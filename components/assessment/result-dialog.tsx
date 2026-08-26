"use client";

type ResultDialogProps = {
  open: boolean;
  correct: boolean;
  explanation: string;
  onNext: () => void;
};

export function ResultDialog({
  open,
  correct,
  explanation,
  onNext,
}: ResultDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">

        <div className="text-center">

          <div className="text-6xl">
            {correct ? "🎉" : "📚"}
          </div>

          <h2 className="mt-4 text-3xl font-bold">

            {correct
              ? "إجابة صحيحة"
              : "إجابة غير صحيحة"}

          </h2>

          <p className="mt-5 leading-8 text-slate-600">
            {explanation}
          </p>

          {correct && (
            <div className="mt-6 rounded-2xl bg-green-50 p-5">

              <div className="text-2xl font-bold text-green-700">

                ⭐ +20 XP

              </div>

              <div className="mt-2 text-green-600">

                أحسنت، استمر في التقدم.

              </div>

            </div>
          )}

          <button
            onClick={onNext}
            className="mt-8 w-full rounded-2xl bg-teal-700 py-4 text-lg font-bold text-white hover:bg-teal-800"
          >
            السؤال التالي →
          </button>

        </div>

      </div>

    </div>
  );
}
