type StatCardProps = {
  title: string;
  value: string | number;
  icon: string;
};

export default function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="text-4xl mb-3">{icon}</div>

      <h2 className="text-gray-500 text-sm">
        {title}
      </h2>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}