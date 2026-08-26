import Link from "next/link";

type Props = {
  lessonId: string;
  title: string;
};

export default function ContinueLearningCard({
  lessonId,
  title,
}: Props) {
  return (
    <Link
      href={`/lessons/${lessonId}`}
      className="block rounded-2xl border p-6 hover:border-emerald-500 transition-all"
    >
      <div className="text-sm text-slate-500">
        تابع التعلم
      </div>

      <div className="mt-2 text-xl font-bold">
        {title}
      </div>
    </Link>
  );
}
