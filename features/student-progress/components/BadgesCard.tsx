type Badge = {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
};

type Props = {
  badges: Badge[];
};

export default function BadgesCard({
  badges,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-5 text-xl font-bold">
        الشارات
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">

        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-xl border p-4 text-center transition-all ${
              badge.unlocked
                ? "border-emerald-500 bg-emerald-50"
                : "opacity-40"
            }`}
          >
            <div className="text-4xl">
              {badge.icon}
            </div>

            <div className="mt-3 text-sm font-semibold">
              {badge.title}
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}
