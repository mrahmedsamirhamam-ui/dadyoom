import { createClient } from "@/lib/supabase/server";

type StudentRow = {
  id: string;
  full_name: string;
  email: string;
  country: string | null;
  created_at: string | null;
};

type ProgressRow = {
  student_id: string;
  status: string;
  xp: number;
};

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const [
    studentsResult,
    progressResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email,country,created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),

    supabase
      .from("student_lesson_progress")
      .select("student_id,status,xp"),
  ]);

  if (studentsResult.error) {
    throw new Error(
      studentsResult.error.message
    );
  }

  if (progressResult.error) {
    throw new Error(
      progressResult.error.message
    );
  }

  const students =
    (studentsResult.data ?? []) as StudentRow[];

  const progress =
    (progressResult.data ?? []) as ProgressRow[];

  const metrics =
    new Map<
      string,
      {
        completed: number;
        xp: number;
      }
    >();

  for (const row of progress) {
    const current =
      metrics.get(row.student_id) ?? {
        completed: 0,
        xp: 0,
      };

    if (
      row.status === "completed" ||
      row.status === "mastered"
    ) {
      current.completed += 1;
    }

    current.xp += Number(row.xp ?? 0);

    metrics.set(
      row.student_id,
      current
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
              الطلاب
            </h1>
            <p className="mt-2 font-arabic-reading text-lg text-[#73695d]">
              حسابات الطلاب وتقدمهم الفعلي داخل الدروس.
            </p>
          </div>

          <div className="rounded-2xl bg-[#123f39] px-5 py-3 text-center text-white">
            <div className="text-2xl font-black text-[#f5cf7a]">
              {students.length}
            </div>
            <div className="text-[10px] font-black">
              حساب
            </div>
          </div>
        </section>

        <div className="overflow-hidden rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right">
              <thead className="bg-[#f4ead7] text-xs font-black text-[#6f5a36]">
                <tr>
                  <th className="p-4">الطالب</th>
                  <th className="p-4">الدولة</th>
                  <th className="p-4">البريد</th>
                  <th className="p-4">دروس مكتملة</th>
                  <th className="p-4">XP</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const metric =
                    metrics.get(student.id) ?? {
                      completed: 0,
                      xp: 0,
                    };

                  return (
                    <tr
                      key={student.id}
                      className="border-t border-[#eee3cf]"
                    >
                      <td className="p-4 font-black text-[#123f39]">
                        {student.full_name || "طالب ضاديوم"}
                      </td>
                      <td className="p-4 text-[#6f665d]">
                        {student.country || "—"}
                      </td>
                      <td className="p-4 text-[#6f665d]">
                        {student.email}
                      </td>
                      <td className="p-4 font-black">
                        {metric.completed}
                      </td>
                      <td className="p-4 font-black text-[#9a7028]">
                        {metric.xp}
                      </td>
                    </tr>
                  );
                })}

                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center font-bold text-[#7b7164]"
                    >
                      لا توجد حسابات طلاب بعد.
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
