import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getLessonForEdit } from "@/features/teacher/queries/getLessonForEdit";
import { updateLesson } from "@/features/teacher/actions/updateLesson";
import { updateLessonStatus } from "@/features/teacher/actions/updateLessonStatus";
import LessonEditor from "@/features/teacher/components/LessonEditor";
import { getLessonVocabulary } from "@/features/vocabulary/queries/getLessonVocabulary";
import VocabularyManager from "@/features/vocabulary/components/VocabularyManager";
import LessonObjectivesEditor from "@/features/teacher/components/LessonObjectivesEditor";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditLessonPage({ params }: Props) {
  const { id } = await params;

  /*
   * TEACHER_LESSON_EDIT_SECURITY_GUARD
   *
   * يسمح فقط للمعلم صاحب الدرس أو مدير النظام
   * بفتح واجهة تحرير الدرس.
   */
  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    throw new Error(
      "تعذر التحقق من صلاحيات الحساب."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "teacher" &&
    role !== "admin"
  ) {
    if (
      role === "student"
    ) {
      redirect("/student");
    }

    if (
      role === "parent"
    ) {
      redirect("/parent");
    }

    if (
      role === "school"
    ) {
      redirect("/school");
    }

    redirect("/");
  }

  const lesson = await getLessonForEdit(id);
  if (
    role === "teacher" &&
    lesson.created_by !== user.id
  ) {
    /*
     * لا نكشف للمعلم أن الدرس
     * موجود أصلًا إذا لم يكن ملكه.
     */
    notFound();
  }

  const vocabulary = await getLessonVocabulary(lesson.id);

  const objectives: string[] =
    Array.isArray(
      lesson.learning_objectives
    )
      ? lesson.learning_objectives
          .filter(
            (item: unknown): item is string =>
              typeof item === "string"
          )
          .map(
            (item: string) =>
              item.trim()
          )
          .filter(Boolean)
      : [];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow">
        <h1 className="mb-8 text-3xl font-bold">تعديل الدرس</h1>

        {/* قسم إدارة حالة الدرس */}
        <section className="mb-8 rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">حالة الدرس الحالية</p>
              <p className="mt-1 text-lg font-bold">{lesson.status}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {lesson.status !== "published" ? (
                <form action={updateLessonStatus}>
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <input type="hidden" name="status" value="published" />
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    نشر الدرس
                  </button>
                </form>
              ) : (
                <form action={updateLessonStatus}>
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <input type="hidden" name="status" value="review" />
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-white transition-colors hover:bg-amber-600"
                  >
                    إعادته للمراجعة
                  </button>
                </form>
              )}

              <form action={updateLessonStatus}>
                <input type="hidden" name="lesson_id" value={lesson.id} />
                <input type="hidden" name="status" value="draft" />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-200 px-5 py-3 font-bold text-slate-800 transition-colors hover:bg-slate-300"
                >
                  حفظ كمسودة
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* محرر الدرس */}
        <LessonEditor
          general={
            <form action={updateLesson} className="space-y-6">
              <input type="hidden" name="id" value={lesson.id} />

              <div>
                <label className="mb-2 block font-semibold">عنوان الدرس</label>
                <input
                  name="title"
                  defaultValue={lesson.title}
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">الملخص</label>
                <textarea
                  name="summary"
                  defaultValue={lesson.summary ?? ""}
                  rows={4}
                  className="w-full rounded-xl border p-3"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
              >
                حفظ التعديلات
              </button>
            </form>
          }
          content={
            <form
              action={updateLesson}
              className="space-y-5 rounded-2xl border bg-white p-6"
            >
              <input
                type="hidden"
                name="id"
                value={lesson.id}
              />

              <h2 className="mb-4 text-2xl font-bold">محتوى الدرس</h2>

              <textarea
                name="content"
                defaultValue={lesson.content ?? ""}
                rows={18}
                className="w-full rounded-xl border p-4"
              />

              <button
                type="submit"
                data-testid="lesson-content-save"
                className="rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white transition-colors hover:bg-emerald-700"
              >
                {"\u062d\u0641\u0638 \u0627\u0644\u0645\u062d\u062a\u0648\u0649"}
              </button>
            </form>
          }
          vocabulary={
            <VocabularyManager
              lessonId={lesson.id}
              vocabulary={vocabulary}
            />
          }
          questions={
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-2xl font-bold">الأسئلة</h2>
              <p className="mt-4 text-slate-500">سيتم إدارة الأسئلة من هنا.</p>
            </div>
          }
          objectives={
            <LessonObjectivesEditor
              key="lesson-objectives"
              lessonId={lesson.id}
              objectives={objectives}
            />
          }
          media={
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-2xl font-bold">الوسائط</h2>
              <p className="mt-4 text-slate-500">
                سيتم رفع الصور والملفات الصوتية هنا.
              </p>
            </div>
          }
        />
      </div>
    </main>
  );
}