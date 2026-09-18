import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-slate-50 py-20 text-center">
      <h1 className="text-6xl font-bold text-teal-700">
        ضاديوم
      </h1>

      <h2 className="mt-4 text-3xl text-gray-700">
        بيت العربية الرقمي
      </h2>

      <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-gray-600">
        اللغة العربية ليست مادة دراسية فقط؛ إنها هوية وثقافة ورسالة.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/signup"
          className="touch-manipulation rounded-2xl bg-teal-700 px-7 py-4 font-black text-white shadow-md transition active:scale-95 active:opacity-80"
        >
          ابدأ رحلتك
        </Link>

        <Link
          href="/ask"
          className="touch-manipulation rounded-2xl border border-teal-700 bg-white px-7 py-4 font-black text-teal-700 transition active:scale-95 active:bg-teal-50"
        >
          🤖 اسأل ضاد
        </Link>
      </div>
    </section>
  );
}
