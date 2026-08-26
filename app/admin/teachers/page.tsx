import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type TeacherRow = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  created_at: string | null;
};

type ClassRow = {
  teacher_id: string;
  is_active: boolean;
};

export default async function AdminTeachersPage() {
  const supabase = await createClient();

  const classroomDb =
    supabase as unknown as SupabaseClient;

  const [
    teachersResult,
    classesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email,country,created_at")
      .eq("role", "teacher")
      .order("created_at", { ascending: false }),

    classroomDb
      .from("teacher_classes")
      .select("teacher_id,is_active"),
  ]);

  if (teachersResult.error) {
    throw new Error(
      teachersResult.error.message
    );
  }

  if (classesResult.error) {
    throw new Error(
      classesResult.error.message
    );
  }

  const teachers =
    (teachersResult.data ?? []) as TeacherRow[];

  const classes =
    (classesResult.data ?? []) as ClassRow[];

  const classCount =
    new Map<string, number>();

  for (const row of classes) {
    if (!row.is_active) {
      continue;
    }

    classCount.set(
      row.teacher_id,
      (classCount.get(row.teacher_id) ?? 0) + 1
    );
  }

  return (
    <main
      dir="rtl"
      className="px-4 py-7 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
          <div>
            <p className="text-xs font-black text-[#9a7028]">
              إدارة المستخدمين
            </p>

            <h1 className="mt-1 font-arabic-display text-3xl font-black text-[#123f39]">
              المعلمون
            </h1>

            <p className="mt-2 font-arabic-reading text-lg text-[#73695d]">
              المعلم يثري المناهج الجاهزة ويتابع فصوله؛ لا يبدأ بناء المنهج من صفحة فارغة.
            </p>
          </div>

          <div className="rounded-2xl bg-[#123f39] px-5 py-3 text-center text-white">
            <div className="text-2xl font-black text-[#f5cf7a]">
              {teachers.length}
            </div>
            <div className="text-[10px] font-black">
              معلم
            </div>
          </div>
        </section>

        <div className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right">
              <thead className="bg-[#f4ead7] text-xs font-black text-[#6f5a36]">
                <tr>
                  <th className="p-4">المعلم</th>
                  <th className="p-4">الدولة</th>
                  <th className="p-4">البريد</th>
                  <th className="p-4">الفصول النشطة</th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-t border-[#eee3cf]"
                  >
                    <td className="p-4 font-black text-[#123f39]">
                      {teacher.full_name || "معلم ضاديوم"}
                    </td>
                    <td className="p-4 text-[#6f665d]">
                      {teacher.country || "—"}
                    </td>
                    <td className="p-4 text-[#6f665d]">
                      {teacher.email}
                    </td>
                    <td className="p-4 font-black text-[#9a7028]">
                      {classCount.get(teacher.id) ?? 0}
                    </td>
                  </tr>
                ))}

                {teachers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-10 text-center font-bold text-[#7b7164]"
                    >
                      لا توجد حسابات معلمين بعد.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
