"use client";

type ChoiceOptionProps = {
  text: string;
  selected: boolean;
  onClick: () => void;
};

export function ChoiceOption({
  text,
  selected,
  onClick,
}: ChoiceOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-right transition-all duration-200
      ${
        selected
          ? "border-teal-600 bg-teal-50 text-teal-900"
          : "border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50"
      }`}
    >
      {text}
    </button>
  );
}
