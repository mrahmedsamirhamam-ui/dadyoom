import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherPage() {
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from("lessons")
    .select(`
      id,
      title,
      lesson_number,
      lesson_type,
      status,
      estimated_minutes
    `)
    .order("lesson_number");

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 p-8"
    >
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              لوحة المعلم
            </h1>

            <p className="mt-2 text-slate-500">
              إدارة محتوى المنهج
            </p>
          </div>

          <Link
            href="/teacher/new"
            className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
          >
            + إضافة درس
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow">

          <table className="w-full">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-4 text-right">
                  #
                </th>

                <th className="p-4 text-right">
                  عنوان الدرس
                </th>

                <th className="p-4 text-right">
                  النوع
                </th>

                <th className="p-4 text-right">
                  المدة
                </th>

                <th className="p-4 text-right">
                  الحالة
                </th>

                <th className="p-4 text-right">
                  إدارة
                </th>

              </tr>

            </thead>

            <tbody>

              {lessons?.map((lesson) => (

                <tr
                  key={lesson.id}
                  className="border-t"
                >

                  <td className="p-4">
                    {lesson.lesson_number}
                  </td>

                  <td className="p-4 font-semibold">
                    {lesson.title}
                  </td>

                  <td className="p-4">
                    {lesson.lesson_type}
                  </td>

                  <td className="p-4">
                    {lesson.estimated_minutes} دقيقة
                  </td>

                  <td className="p-4">
                    {lesson.status}
                  </td>

                  <td className="p-4">

                    <Link
                      href={`/teacher/${lesson.id}`}
                      className="font-bold text-emerald-700"
                    >
                      تعديل
                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </main>
  );
}