import type {
  ActiveParentLinkCode,
} from "@/features/parent-link/services/student-parent-link";

import {
  createParentLinkCodeAction,
} from "@/features/parent-link/actions/createParentLinkCode";

type Props = {
  code: ActiveParentLinkCode | null;
  successMessage?: string;
  errorMessage?: string;
};

export default function StudentParentLinkCard({
  code,
  successMessage,
  errorMessage,
}: Props) {
  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
      <p className="text-sm font-black text-sky-700">
        👨‍👩‍👧 ربط ولي الأمر
      </p>

      <h2 className="mt-1 text-2xl font-black text-slate-900">
        شارك كود الربط مع ولي أمرك
      </h2>

      <p className="mt-2 text-sm leading-7 text-slate-500">
        أنشئ كودًا مؤقتًا ثم أعطه لولي أمرك لربط حسابه بحسابك بأمان.
      </p>

      {successMessage ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 font-bold text-emerald-700">
          ✓ {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 font-bold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {code ? (
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-500">
            كود الربط الحالي
          </div>

          <div
            dir="ltr"
            className="mt-2 text-3xl font-black tracking-[0.25em] text-sky-700"
          >
            {code.code}
          </div>

          <div className="mt-2 text-xs text-slate-500">
            صالح لمدة محدودة وحتى الاستخدام.
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-slate-500">
          لا يوجد كود فعال حاليًا.
        </div>
      )}

      <form
        action={createParentLinkCodeAction}
        className="mt-5"
      >
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-5 py-3 font-black text-white transition hover:bg-sky-700"
        >
          {code
            ? "إنشاء كود جديد"
            : "إنشاء كود ولي الأمر"}
        </button>
      </form>
    </section>
  );
}
