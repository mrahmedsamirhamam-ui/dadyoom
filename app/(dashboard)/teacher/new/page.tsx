
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTeacherLesson } from "@/features/teacher/actions/createLesson";

type UnitOption = {
  id: string;
  title: string;
  unit_number: number | null;
  grades: {
    name_ar: string;
    curricula: {
      name_ar: string;
      countries: { name_ar: string };
    };
  };
};

export default async function NewLessonPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role?.trim().toLowerCase() ?? "";
  if (role !== "teacher" && role !== "admin") redirect("/");

  const { data, error } = await supabase
    .from("units")
    .select(`
      id,
      title,
      unit_number,
      grades!inner (
        name_ar,
        curricula!inner (
          name_ar,
          countries!inner (name_ar)
        )
      )
    `)
    .order("unit_number", { ascending: true });

  if (error) throw new Error(`تعذر تحميل الوحدات: ${error.message}`);
  const units = (data ?? []) as unknown as UnitOption[];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-black text-teal-700">منصة المعلم</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">إنشاء درس جديد</h1>
          <p className="mt-2 max-w-3xl leading-8 text-slate-600">
            أنشئ مسودة درس داخل المنهج الرسمي، ثم أضف الأهداف والمفردات والأسئلة والوسائط من محرر الدرس قبل النشر.
          </p>
        </div>

        <form action={createTeacherLesson} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label className="mb-2 block font-black">عنوان الدرس</label>
            <input name="title" required maxLength={200} className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-teal-500" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-black">الوحدة والمنهج</label>
              <select name="unit_id" required defaultValue="" className="w-full rounded-xl border border-slate-300 bg-white p-3">
                <option value="" disabled>اختر الوحدة</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.grades.curricula.countries.name_ar} — {unit.grades.curricula.name_ar} — {unit.grades.name_ar} — {unit.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block font-black">نوع الدرس</label>
              <select name="lesson_type" defaultValue="reading" className="w-full rounded-xl border border-slate-300 bg-white p-3">
                <option value="reading">قراءة</option>
                <option value="writing">كتابة</option>
                <option value="listening">استماع</option>
                <option value="speaking">تحدث</option>
                <option value="grammar">قواعد</option>
                <option value="vocabulary">مفردات</option>
              </select>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="mb-2 block font-black">المدة المتوقعة بالدقائق</label>
            <input name="estimated_minutes" type="number" min={5} max={180} defaultValue={20} required className="w-full rounded-xl border border-slate-300 p-3" />
          </div>

          <div>
            <label className="mb-2 block font-black">ملخص الدرس</label>
            <textarea name="summary" rows={3} maxLength={1200} className="w-full rounded-xl border border-slate-300 p-3" />
          </div>

          <div>
            <label className="mb-2 block font-black">محتوى الدرس الأساسي</label>
            <textarea name="content" required rows={14} maxLength={30000} className="w-full rounded-xl border border-slate-300 p-4 leading-8" />
            <p className="mt-2 text-sm text-slate-500">يُنشأ الدرس كمسودة، لذلك يمكنك مراجعته بالكامل قبل النشر.</p>
          </div>

          <button type="submit" className="rounded-xl bg-teal-700 px-7 py-3 font-black text-white transition hover:bg-teal-800">
            إنشاء المسودة وفتح المحرر
          </button>
        </form>
      </div>
    </main>
  );
}
