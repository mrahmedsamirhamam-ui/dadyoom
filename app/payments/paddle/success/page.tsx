import Link from "next/link";

export default function PaddleSuccessPage() {
  return (
    <main
      dir="rtl"
      className="mx-auto max-w-2xl px-4 py-16"
    >
      <section className="rounded-[2rem] border bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black text-[#123f39]">
          تم استلام عملية الدفع
        </h1>

        <p className="mt-4 leading-8 text-slate-600">
          يقوم ضاديوم بتأكيد الاشتراك من Paddle عبر
          الاتصال الآمن بالخادم. إذا لم تظهر Plus فورًا،
          افتح صفحة الاشتراك مرة أخرى بعد تحديث الصفحة.
        </p>

        <Link
          href="/pricing"
          className="dadyoom-arabic-button mt-6 inline-flex rounded-2xl px-6 py-3 font-black text-white"
        >
          العودة إلى ضاديوم Plus
        </Link>
      </section>
    </main>
  );
}
