import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at");

  console.log("DATA:", courses);
  console.log("ERROR:", error);

  return (
    <main className="min-h-screen bg-slate-100 p-8" dir="rtl">
      <h1 className="text-4xl font-bold text-teal-700 mb-8">
        الدورات التعليمية
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {courses?.map((course) => (

          <div
            key={course.id}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >

            {course.image_url && (
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
            )}

            <div className="p-6">

              <h2 className="text-2xl font-bold">
                {course.title}
              </h2>

              <p className="text-gray-600 mt-3">
                {course.description}
              </p>

              <span className="inline-block mt-4 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm">
                {course.level}
              </span>

              <Link
                href={`/courses/${course.id}`}
                className="block mt-6 bg-teal-700 text-white text-center py-3 rounded-xl hover:bg-teal-800 transition"
              >
                ابدأ الدورة
              </Link>

            </div>

          </div>

        ))}

      </div>
    </main>
  );
}