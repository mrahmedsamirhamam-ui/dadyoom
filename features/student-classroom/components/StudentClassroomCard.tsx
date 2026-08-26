import type {
  StudentTeacherClass,
} from "@/features/student-classroom/services/student-classes";

import {
  joinTeacherClassAction,
} from "@/features/student-classroom/actions/joinClass";

type Props = {
  classes: StudentTeacherClass[];
  successMessage?: string;
  errorMessage?: string;
};

export default function StudentClassroomCard({
  classes,
  successMessage,
  errorMessage,
}: Props) {
  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

        <div>
          <p className="text-sm font-black text-emerald-700">
            🏫 فصولي
          </p>

          <h2 className="mt-1 text-2xl font-black text-slate-900">
            الفصل الدراسي
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
            أدخل الكود الذي أعطاك إياه معلمك للانضمام إلى الفصل ومتابعة التعلم معه.
          </p>
        </div>

        <form
          action={joinTeacherClassAction}
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            name="join_code"
            required
            dir="ltr"
            autoComplete="off"
            placeholder="JOIN CODE"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center font-black uppercase tracking-widest outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white transition hover:bg-emerald-700"
          >
            انضمام
          </button>
        </form>
      </div>

      {successMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800">
          ✓ {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {classes.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map(
            (teacherClass) => (
              <article
                key={
                  teacherClass.class_id
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  🏫
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  {
                    teacherClass.class_name
                  }
                </h3>

                <p className="mt-2 text-sm font-bold text-emerald-700">
                  المعلم:{" "}
                  {
                    teacherClass.teacher_name
                  }
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    teacherClass.academic_year ??
                    "العام الدراسي غير محدد"
                  }
                </p>

                <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-500">
                  ✓ أنت عضو في هذا الفصل
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
          <div className="text-4xl">
            🎓
          </div>

          <h3 className="mt-3 font-black text-slate-900">
            لم تنضم إلى فصل بعد
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            اطلب كود الانضمام من معلمك ثم أدخله بالأعلى.
          </p>
        </div>
      )}
    </section>
  );
}
