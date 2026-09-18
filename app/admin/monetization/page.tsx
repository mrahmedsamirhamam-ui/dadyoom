import { requireOwnerAdmin } from "@/lib/admin/owner-access";

function Flag({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3">
      <span className="font-bold">{label}</span>
      <span
        className={
          ok
            ? "font-black text-emerald-700"
            : "font-black text-amber-700"
        }
      >
        {ok ? "جاهز" : "ناقص"}
      </span>
    </div>
  );
}

export default async function MonetizationAdminPage() {
  await requireOwnerAdmin();

  const paddleToken = Boolean(
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim(),
  );
  const paddlePrice = Boolean(
    process.env.NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID?.trim(),
  );
  const paddleWebhook = Boolean(
    process.env.PADDLE_WEBHOOK_SECRET?.trim(),
  );
  const adsense = Boolean(
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim(),
  );

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-4xl space-y-6 px-4 py-10"
    >
      <header>
        <h1 className="text-3xl font-black text-[#123f39]">
          تحقيق الدخل
        </h1>
        <p className="mt-2 leading-7 text-slate-600">
          هذه الصفحة لا تعرض أي مفاتيح سرية. تعرض فقط
          هل إعداد الدفع والإعلانات مكتمل أم لا.
        </p>
      </header>

      <section className="rounded-[2rem] border bg-[#fffaf0] p-6">
        <h2 className="text-xl font-black">
          Paddle — اشتراك Plus
        </h2>

        <div className="mt-4 space-y-3">
          <Flag
            ok={paddleToken}
            label="Client-side token"
          />
          <Flag
            ok={paddlePrice}
            label="Plus monthly Price ID"
          />
          <Flag
            ok={paddleWebhook}
            label="Webhook secret"
          />
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          السعر المستهدف: 10 USD شهريًا. وسيلة الدفع
          الظاهرة للعميل: Card فقط.
        </p>
      </section>

      <section className="rounded-[2rem] border bg-white p-6">
        <h2 className="text-xl font-black">
          Google AdSense — الموقع فقط
        </h2>

        <div className="mt-4">
          <Flag
            ok={adsense}
            label="AdSense Publisher ID"
          />
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          الإعلانات لا تُحمّل داخل تطبيق الموبايل، ولا
          للمستخدم Plus، ولا داخل مساحات التعلم الحساسة.
        </p>
      </section>

      <section className="rounded-[2rem] border bg-white p-6 text-sm leading-8">
        <h2 className="text-xl font-black">
          استلام الأرباح
        </h2>
        <p className="mt-3">
          Paddle: تضبط وسيلة السحب من Transfer Preferences
          في حساب Paddle بعد الموافقة على الحساب.
        </p>
        <p>
          AdSense: تضبط الحساب البنكي من Payments بعد
          وصول الحساب إلى حد اختيار وسيلة الدفع.
        </p>
      </section>
    </main>
  );
}
