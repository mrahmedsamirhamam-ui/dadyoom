import { requireOwnerAdmin } from "@/lib/admin/owner-access";
import { livekitConfigured } from "@/lib/livekit/server";

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
    process.env.PADDLE_CLIENT_TOKEN?.trim() ||
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim(),
  );
  const paddlePrice = Boolean(
    process.env.PADDLE_PLUS_PRICE_ID?.trim() ||
      process.env.NEXT_PUBLIC_PADDLE_PLUS_PRICE_ID?.trim(),
  );
  const paddleApiKey = Boolean(
    process.env.PADDLE_API_KEY?.trim(),
  );
  const paddleWebhook = Boolean(
    process.env.PADDLE_WEBHOOK_SECRET?.trim(),
  );
  const paddleEnvironment =
    process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase() === "production"
      ? "Production"
      : "Sandbox";
  const adsenseCandidate =
    process.env.ADSENSE_CLIENT?.trim() ||
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() ||
    "";
  const adsense =
    /^ca-pub-\d{16}$/u.test(adsenseCandidate);
  const liveReady =
    livekitConfigured();

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
            ok={paddleApiKey}
            label="Server API key"
          />
          <Flag
            ok={paddleWebhook}
            label="Webhook secret"
          />
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          البيئة الحالية: <strong>{paddleEnvironment}</strong>.
          السعر المستهدف: 10 USD شهريًا. وسيلة الدفع
          الظاهرة للعميل: Card فقط.
        </p>
      </section>

      <section className="rounded-[2rem] border bg-white p-6">
        <h2 className="text-xl font-black">
          Dadyoom Live
        </h2>

        <div className="mt-4">
          <Flag
            ok={liveReady}
            label="LiveKit production connection"
          />
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          لا تُعرض أي مفاتيح هنا. عند اكتمال الربط يستطيع
          المعلم والطالب الحصول على Token آمن لغرفة الحصة.
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
