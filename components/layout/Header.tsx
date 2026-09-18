import Link from "next/link";

export default function Header() {
  return (
    <header
      className="bg-teal-700 text-white shadow-md"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="text-3xl font-bold"
        >
          ضاديوم
        </Link>

        <nav className="flex flex-wrap gap-5 text-base sm:text-lg">
          <Link
            href="/"
            className="touch-manipulation transition active:scale-95"
          >
            الرئيسية
          </Link>

          <Link
            href="/courses"
            className="touch-manipulation transition active:scale-95"
          >
            المناهج
          </Link>

          <Link
            href="/skills"
            className="touch-manipulation transition active:scale-95"
          >
            المهارات
          </Link>

          <Link
            href="/ask"
            className="touch-manipulation font-black text-yellow-200 transition active:scale-95"
          >
            شات ضاد
          </Link>

          <Link
            href="/teacher/academy"
            className="touch-manipulation transition active:scale-95"
          >
            تدريب المعلم
          </Link>

          <Link
            href="/login"
            className="touch-manipulation transition active:scale-95"
          >
            تسجيل الدخول
          </Link>
        </nav>
      </div>
    </header>
  );
}
