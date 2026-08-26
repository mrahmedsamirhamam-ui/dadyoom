type Props = {
  goal: {
    target: number;
    completed: number;
    remaining: number;
    finished: boolean;
  };
};

export default function DailyGoalCard({
  goal,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow">

      <h2 className="text-2xl font-bold">
        هدف اليوم
      </h2>

      <div className="mt-5 text-4xl font-bold">

        {goal.completed}

        /

        {goal.target}

      </div>

      <p className="mt-3 text-slate-600">

        {goal.finished
          ? "أحسنت! أنجزت هدف اليوم."
          : `بقي ${goal.remaining} درس.`}

      </p>

    </section>
  );
}
