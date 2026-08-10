import type {
  ActiveSchoolTeacherLinkCode,
} from "@/features/school-link/services/teacher-school-link";

import {
  createSchoolTeacherLinkCodeAction,
} from "@/features/school-link/actions/createSchoolTeacherLinkCode";

export default function TeacherSchoolLinkCard({
  code,
}: {
  code: ActiveSchoolTeacherLinkCode | null;
}) {
  return (
    <section className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-indigo-700">
        🏫 ربط المدرسة
      </p>

      <h2 className="mt-1 text-2xl font-black text-slate-900">
        كود ربط المعلم بالمدرسة
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        أنشئ كودًا مؤقتًا وشاركه مع إدارة المدرسة.
      </p>

      {code ? (
        <div className="mt-5 rounded-2xl bg-indigo-50 p-5">
          <div className="text-sm font-bold text-indigo-700">
            الكود الحالي
          </div>

          <div
            dir="ltr"
            className="mt-2 text-3xl font-black tracking-[0.25em] text-indigo-900"
          >
            {code.code}
          </div>
        </div>
      ) : (
        <div className="mt-5 text-sm text-slate-500">
          لا يوجد كود فعال حاليًا.
        </div>
      )}

      <form
        action={createSchoolTeacherLinkCodeAction}
        className="mt-5"
      >
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white"
        >
          {code
            ? "إنشاء كود جديد"
            : "إنشاء كود المدرسة"}
        </button>
      </form>
    </section>
  );
}
