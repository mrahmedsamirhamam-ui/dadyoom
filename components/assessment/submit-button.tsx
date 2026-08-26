"use client";

type SubmitButtonProps = {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
};

export function SubmitButton({
  disabled,
  loading,
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-2xl bg-teal-700 py-4 text-lg font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "⏳ جارٍ إرسال الإجابة..." : "📤 إرسال الإجابة"}
    </button>
  );
}
