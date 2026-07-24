export default function Header() {
  return (
    <header className="bg-teal-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <h1 className="text-3xl font-bold">
          ضاديوم
        </h1>

        <nav className="flex gap-8 text-lg">
          <a href="#" className="hover:text-yellow-300 transition">
            الرئيسية
          </a>

          <a href="#" className="hover:text-yellow-300 transition">
            المناهج
          </a>

          <a href="#" className="hover:text-yellow-300 transition">
            اسأل ضاديوم
          </a>

          <a href="#" className="hover:text-yellow-300 transition">
            أكاديمية المعلمين
          </a>

          <a href="#" className="hover:text-yellow-300 transition">
            تسجيل الدخول
          </a>
        </nav>

      </div>
    </header>
  );
}