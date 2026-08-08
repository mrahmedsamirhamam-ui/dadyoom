type Props = {
  stats: {
    totalXP: number;
    completed: number;
    mastered: number;
    lessons: number;
  };
};

export default function StudentStatisticsCard({
  stats,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">

      <div className="rounded-2xl border p-5">
        <div className="text-sm text-slate-500">
          XP
        </div>

        <div className="text-3xl font-bold">
          {stats.totalXP}
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="text-sm text-slate-500">
          الدروس
        </div>

        <div className="text-3xl font-bold">
          {stats.lessons}
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="text-sm text-slate-500">
          المكتملة
        </div>

        <div className="text-3xl font-bold">
          {stats.completed}
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="text-sm text-slate-500">
          المتقنة
        </div>

        <div className="text-3xl font-bold">
          {stats.mastered}
        </div>
      </div>

    </div>
  );
}