import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      level,
      published,
      created_at,
      categories(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-red-600 text-xl">
          حدث خطأ أثناء تحميل الدورات
        </h1>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">إدارة الدورات</h1>

        <Link
          href="/admin/courses/new"
          className="bg-teal-700 text-white px-5 py-3 rounded-xl"
        >
          ➕ إضافة دورة
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4 text-right">الدورة</th>
              <th className="p-4 text-right">القسم</th>
              <th className="p-4 text-right">المستوى</th>
              <th className="p-4 text-right">الحالة</th>
              <th className="p-4 text-right">الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {courses?.map((course: any) => (
              <tr key={course.id} className="border-t">
                <td className="p-4">{course.title}</td>

                <td className="p-4">
                  {course.categories?.name ?? "-"}
                </td>

                <td className="p-4">{course.level}</td>

                <td className="p-4">
                  {course.published ? "🟢 منشورة" : "⚪ غير منشورة"}
                </td>

                <td className="p-4 flex gap-3">
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="text-blue-600"
                  >
                    ✏️ تعديل
                  </Link>

                  <Link
                    href={`/admin/lessons?course=${course.id}`}
                    className="text-green-600"
                  >
                    📚 الدروس
                  </Link>

                  <Link
                    href={`/courses/${course.id}`}
                    className="text-gray-600"
                  >
                    👁️ معاينة
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {courses?.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            لا توجد دورات حتى الآن.
          </div>
        )}
      </div>
    </main>
  );
}