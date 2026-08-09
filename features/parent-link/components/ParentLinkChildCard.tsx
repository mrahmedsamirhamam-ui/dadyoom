import {
  linkChildByCodeAction,
} from "@/features/parent-link/actions/linkChildByCode";

type Props = {
  successMessage?: string;
  errorMessage?: string;
};

export default function ParentLinkChildCard({
  successMessage,
  errorMessage,
}: Props) {
  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-black text-emerald-700">
        🔗 ربط ابن بالحساب
      </p>

      <h2 className="mt-1 text-2xl font-black text-slate-900">
        أدخل كود الطالب
      </h2>

      <p className="mt-2 text-sm leading-7 text-slate-500">
        اطلب من الطالب إنشاء كود ربط من حسابه، ثم أدخله هنا.
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

      <form
        action={linkChildByCodeAction}
        className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto]"
      >
        <input
          name="code"
          required
          dir="ltr"
          placeholder="LINK CODE"
          className="rounded-xl border border-slate-300 px-4 py-3 text-center font-black uppercase tracking-widest outline-none focus:border-emerald-500"
        />

        <select
          name="relationship"
          defaultValue=""
          className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="">
            العلاقة
          </option>
          <option value="الأب">
            الأب
          </option>
          <option value="الأم">
            الأم
          </option>
          <option value="ولي أمر">
            ولي أمر
          </option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-black text-white transition hover:bg-emerald-700"
        >
          ربط الطالب
        </button>
      </form>
    </section>
  );
}
