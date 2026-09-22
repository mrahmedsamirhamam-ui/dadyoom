type Props = {
  level: {
    level: number;
    name?: string;
    currentXP: number;
    nextLevelXP: number;
    percent: number;
    maxed?: boolean;
  };
};

export default function StudentLevelCard({ level }: Props) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 p-6 text-white">
      <div className="text-sm opacity-80">المستوى الحالي</div>

      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div className="text-5xl font-bold">{level.level}</div>
        {level.name ? (
          <div className="pb-1 text-lg font-black">{level.name}</div>
        ) : null}
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${level.percent}%` }}
        />
      </div>

      <div className="mt-3 text-sm">
        {level.maxed || level.nextLevelXP <= 0
          ? "أعلى مستوى — واصل جمع الإنجازات"
          : `${level.currentXP} / ${level.nextLevelXP} XP`}
      </div>
    </div>
  );
}
