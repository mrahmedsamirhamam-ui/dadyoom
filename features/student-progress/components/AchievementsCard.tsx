type Achievement = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
};

type Props = {
  achievements: Achievement[];
};

export default function AchievementsCard({
  achievements,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-2xl font-bold">
        الإنجازات
      </h2>

      <div className="space-y-5">

        {achievements.map((item) => {

          const percent = Math.min(
            100,
            Math.round(
              (item.progress / item.target) * 100
            )
          );

          return (
            <div
              key={item.id}
              className="space-y-2"
            >

              <div className="flex justify-between">

                <div>

                  <div className="font-bold">
                    {item.title}
                  </div>

                  <div className="text-sm text-slate-500">
                    {item.description}
                  </div>

                </div>

                <div className="font-bold">

                  {item.progress}/{item.target}

                </div>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-200">

                <div
                  className={`h-full transition-all ${
                    item.completed
                      ? "bg-green-600"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width: `${percent}%`,
                  }}
                />

              </div>

            </div>
          );

        })}

      </div>

    </div>
  );
}