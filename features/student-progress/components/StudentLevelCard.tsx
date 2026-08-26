type Props = {
  level: {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    percent: number;
  };
};

export default function StudentLevelCard({
  level,
}: Props) {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 p-6 text-white">

      <div className="text-sm opacity-80">
        المستوى الحالي
      </div>

      <div className="mt-2 text-5xl font-bold">
        {level.level}
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/20">

        <div
          className="h-full rounded-full bg-white transition-all"
          style={{
            width: `${level.percent}%`,
          }}
        />

      </div>

      <div className="mt-3 text-sm">

        {level.currentXP}

        /

        {level.nextLevelXP}

        XP

      </div>

    </div>
  );
}
