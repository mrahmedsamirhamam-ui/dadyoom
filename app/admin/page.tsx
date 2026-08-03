import Link from "next/link";
import { getDashboardStats } from "@/lib/admin/dashboard";

// مكون فرعي لعرض بطاقات الإحصائيات
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "إدارة الدورات",
      href: "/admin/courses",
      icon: "📚",
    },
    {
      title: "إدارة الدروس",
      href: "/admin/lessons",
      icon: "📝",
    },
    {
      title: "إدارة الطلاب",
      href: "/admin/students",
      icon: "🎓",
    },
    {
      title: "إدارة المعلمين",
      href: "/admin/teachers",
      icon: "👨‍🏫",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-8 space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-teal-700 mb-6">
          لوحة تحكم ضاديوم
        </h1>

        {/* قسم بطاقات الإحصائيات */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="الطلاب" value={stats.students} />
          <StatCard title="الدروس" value={stats.lessons} />
          <StatCard title="الدروس المكتملة" value={stats.completedLessons} />
          <StatCard title="محادثات ضاد" value={stats.chats} />
        </div>
      </div>

      {/* قسم روابط الإدارة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition border border-slate-100 block"
          >
            <div className="text-4xl mb-3">{card.icon}</div>
            <h2 className="text-xl font-bold text-slate-800">{card.title}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}