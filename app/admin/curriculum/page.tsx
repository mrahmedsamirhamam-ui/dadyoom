import {
  createCountryAction,
  createCurriculumAction,
  createGradeAction,
  createSubjectAction,
  createUnitAction,
} from "./actions";

import {
  createClient,
} from "@/lib/supabase/server";

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-500";

const button =
  "rounded-xl bg-teal-700 px-5 py-3 font-black text-white hover:bg-teal-800";

export default async function CurriculumPage() {
  const supabase =
    await createClient();

  const [
    countriesResult,
    curriculaResult,
    gradesResult,
    subjectsResult,
    unitsResult,
  ] =
    await Promise.all([
      supabase
        .from("edu_countries")
        .select(
          "id,name_ar,name_en"
        )
        .order("name_ar"),

      supabase
        .from("edu_curricula")
        .select(
          "id,name_ar,country_id"
        )
        .order("name_ar"),

      supabase
        .from("edu_grades")
        .select(
          "id,name_ar,curriculum_id,order_no"
        )
        .order(
          "order_no"
        ),

      supabase
        .from("edu_subjects")
        .select(
          "id,name_ar,grade_id,icon,order_no"
        )
        .order(
          "order_no"
        ),

      supabase
        .from("edu_units")
        .select(
          "id,title,subject_id,order_no,is_published"
        )
        .order(
          "order_no"
        ),
    ]);

  const error =
    countriesResult.error ||
    curriculaResult.error ||
    gradesResult.error ||
    subjectsResult.error ||
    unitsResult.error;

  if (error) {
    throw error;
  }

  const countries =
    countriesResult.data ?? [];

  const curricula =
    curriculaResult.data ?? [];

  const grades =
    gradesResult.data ?? [];

  const subjects =
    subjectsResult.data ?? [];

  const units =
    unitsResult.data ?? [];

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-7xl space-y-8 p-6"
    >
      <section className="rounded-3xl bg-gradient-to-l from-teal-700 to-emerald-600 p-7 text-white">
        <p className="text-sm font-black text-teal-100">
          إدارة المحتوى الأكاديمي
        </p>

        <h1 className="mt-2 text-3xl font-black">
          هيكل مناهج ضاديوم
        </h1>

        <p className="mt-3 max-w-3xl leading-8 text-teal-50">
          الدولة ← المنهج ← الصف ← المادة ← الوحدة ← الدرس
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          <Stat title="الدول" value={countries.length} />
          <Stat title="المناهج" value={curricula.length} />
          <Stat title="الصفوف" value={grades.length} />
          <Stat title="المواد" value={subjects.length} />
          <Stat title="الوحدات" value={units.length} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="🌍 إضافة دولة">
          <form
            action={createCountryAction}
            className="space-y-3"
          >
            <input
              name="name_ar"
              required
              placeholder="اسم الدولة بالعربية"
              className={field}
            />

            <input
              name="name_en"
              placeholder="اسم الدولة بالإنجليزية"
              className={field}
            />

            <button className={button}>
              إضافة الدولة
            </button>
          </form>
        </Card>

        <Card title="📚 إضافة منهج">
          <form
            action={createCurriculumAction}
            className="space-y-3"
          >
            <select
              name="country_id"
              required
              className={field}
            >
              <option value="">
                اختر الدولة
              </option>

              {countries.map(
                (country) => (
                  <option
                    key={country.id}
                    value={country.id}
                  >
                    {country.name_ar}
                  </option>
                )
              )}
            </select>

            <input
              name="name_ar"
              required
              placeholder="اسم المنهج"
              className={field}
            />

            <input
              name="name_en"
              placeholder="الاسم بالإنجليزية"
              className={field}
            />

            <button className={button}>
              إضافة المنهج
            </button>
          </form>
        </Card>

        <Card title="🎓 إضافة صف">
          <form
            action={createGradeAction}
            className="space-y-3"
          >
            <select
              name="curriculum_id"
              required
              className={field}
            >
              <option value="">
                اختر المنهج
              </option>

              {curricula.map(
                (curriculum) => (
                  <option
                    key={curriculum.id}
                    value={curriculum.id}
                  >
                    {curriculum.name_ar}
                  </option>
                )
              )}
            </select>

            <input
              name="name_ar"
              required
              placeholder="مثال: الصف الرابع"
              className={field}
            />

            <input
              name="name_en"
              placeholder="Grade 4"
              className={field}
            />

            <input
              name="order_no"
              type="number"
              min="0"
              defaultValue="1"
              className={field}
            />

            <button className={button}>
              إضافة الصف
            </button>
          </form>
        </Card>

        <Card title="📖 إضافة مادة">
          <form
            action={createSubjectAction}
            className="space-y-3"
          >
            <select
              name="grade_id"
              required
              className={field}
            >
              <option value="">
                اختر الصف
              </option>

              {grades.map(
                (grade) => (
                  <option
                    key={grade.id}
                    value={grade.id}
                  >
                    {grade.name_ar}
                  </option>
                )
              )}
            </select>

            <input
              name="name_ar"
              required
              placeholder="مثال: اللغة العربية"
              className={field}
            />

            <input
              name="name_en"
              placeholder="Arabic Language"
              className={field}
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                name="icon"
                placeholder="📘"
                className={field}
              />

              <input
                name="color"
                placeholder="#0f766e"
                className={field}
              />
            </div>

            <input
              name="order_no"
              type="number"
              min="0"
              defaultValue="1"
              className={field}
            />

            <button className={button}>
              إضافة المادة
            </button>
          </form>
        </Card>

        <Card title="🗂️ إضافة وحدة">
          <form
            action={createUnitAction}
            className="space-y-3"
          >
            <select
              name="subject_id"
              required
              className={field}
            >
              <option value="">
                اختر المادة
              </option>

              {subjects.map(
                (subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.icon ?? "📘"}{" "}
                    {subject.name_ar}
                  </option>
                )
              )}
            </select>

            <input
              name="title"
              required
              placeholder="عنوان الوحدة"
              className={field}
            />

            <textarea
              name="description"
              placeholder="وصف الوحدة"
              rows={3}
              className={field}
            />

            <input
              name="order_no"
              type="number"
              min="0"
              defaultValue="1"
              className={field}
            />

            <label className="flex items-center gap-2 font-bold text-slate-700">
              <input
                type="checkbox"
                name="is_published"
              />
              نشر الوحدة
            </label>

            <button className={button}>
              إضافة الوحدة
            </button>
          </form>
        </Card>

        <Card title="📊 المحتوى الحالي">
          <div className="space-y-4">
            {subjects.map(
              (subject) => {
                const subjectUnits =
                  units.filter(
                    (unit) =>
                      unit.subject_id ===
                      subject.id
                  );

                return (
                  <div
                    key={subject.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="font-black text-slate-900">
                      {subject.icon ?? "📘"}{" "}
                      {subject.name_ar}
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      {subjectUnits.length} وحدات
                    </div>
                  </div>
                );
              }
            )}

            {subjects.length === 0 ? (
              <p className="text-slate-500">
                لا توجد مواد حتى الآن.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-5 text-xl font-black text-slate-900">
        {title}
      </h2>

      {children}
    </section>
  );
}

function Stat({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-3 text-center">
      <div className="text-2xl font-black">
        {value}
      </div>

      <div className="text-xs font-bold text-teal-50">
        {title}
      </div>
    </div>
  );
}