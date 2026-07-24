export default function Hero() {
  return (
    <section className="py-20 text-center bg-slate-50">
      <h1 className="text-6xl font-bold text-teal-700">
        ضاديوم
      </h1>

      <h2 className="mt-4 text-3xl text-gray-700">
        بيت العربية الرقمي
      </h2>

      <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-9">
        اللغة العربية ليست مادة دراسية...
        إنها هوية وثقافة ورسالة.
      </p>

      <button className="mt-10 bg-teal-700 hover:bg-teal-800 text-white px-8 py-4 rounded-xl transition">
        ابدأ رحلتك
      </button>
    </section>
  );
}