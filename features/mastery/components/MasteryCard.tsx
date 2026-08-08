import {
  MasteryState,
  masteryColor,
} from "../services/mastery-engine";

type Props = {
  mastery: MasteryState;
};

const labels = {
  mastered: "متقن",
  proficient: "جيد جدًا",
  developing: "قيد التطوير",
  struggling: "يحتاج دعمًا",
};

export default function MasteryCard({
  mastery,
}: Props) {
  const color = masteryColor(mastery);

  return (
    <section
      className={`rounded-3xl border border-${color}-300 bg-${color}-50 p-6`}
    >
      <h2 className="text-2xl font-bold">
        مستوى الإتقان
      </h2>

      <div className="mt-5 text-4xl font-bold">
        {labels[mastery]}
      </div>
    </section>
  );
}