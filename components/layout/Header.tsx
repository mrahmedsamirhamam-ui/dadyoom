import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-teal-700 text-white shadow-md" dir="rtl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-4">

        <h1 className="text-3xl font-bold">
          ضاديوم
        </h1>

        <nav className="flex gap-8 text-lg">
          <Link href="/" className="hover:text-yellow-300 transition">
            الرئيسية
          </Link>

          <a href="#" className="hover:text-yellow-300 transition">
            المناهج
          </a>

          <Link href="/ask" className="hover:text-yellow-300 transition">
            اسأل ضاديوم
          </Link>

          <a href="#" className="hover:text-yellow-300 transition">
            أكاديمية المعلمين
          </a>

          <Link href="/login" className="hover:text-yellow-300 transition">
            تسجيل الدخول
          </Link>
        </nav>

      </div>
    </header>
  );
}
