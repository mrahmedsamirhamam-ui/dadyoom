import { createClient } from "@/lib/supabase/server";
import { createCourse } from "./actions";

export default async function NewCoursePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <main className="max-w-3xl mx-auto p-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8">
        إضافة دورة جديدة
      </h1>

      <form action={createCourse} className="space-y-6">

        <input
          name="title"
          placeholder="اسم الدورة"
          required
          className="w-full border rounded-xl p-3"
        />

        <textarea
          name="description"
          placeholder="وصف الدورة"
          rows={5}
          className="w-full border rounded-xl p-3"
        />

        <select
          name="category_id"
          required
          className="w-full border rounded-xl p-3"
        >
          <option value="">اختر القسم</option>

          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          name="level"
          className="w-full border rounded-xl p-3"
        >
          <option>مبتدئ</option>
          <option>متوسط</option>
          <option>متقدم</option>
        </select>

        <input
          name="image_url"
          placeholder="رابط صورة الدورة"
          className="w-full border rounded-xl p-3"
        />

        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" />
          نشر الدورة مباشرة
        </label>

        <button
          type="submit"
          className="bg-teal-700 text-white px-8 py-3 rounded-xl"
        >
          حفظ الدورة
        </button>

      </form>
    </main>
  );
}
