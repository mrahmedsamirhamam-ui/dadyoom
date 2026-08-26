type Props = {
  streak: number;
};

export default function StreakCard({
  streak,
}: Props) {
  return (
    <div className="rounded-2xl bg-orange-500 p-6 text-white">

      <div className="text-sm">
        سلسلة التعلم
      </div>

      <div className="mt-2 text-5xl font-bold">

        🔥 {streak}

      </div>

      <div className="mt-2">
        يوم متواصل
      </div>

    </div>
  );
}
