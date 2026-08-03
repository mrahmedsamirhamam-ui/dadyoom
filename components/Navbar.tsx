import Link from "next/link";
<Link href="/student">لوحة الطالب</Link>

export default function Navbar() {
  return (
    <nav className="bg-teal-700 text-white px-8 py-4 flex justify-between">

      <h1 className="font-bold text-2xl">
        ضاديوم
      </h1>

      <div className="flex gap-6">

        <Link href="/">الرئيسية</Link>

        <Link href="/student">الطالب</Link>

        <Link href="/dictionary">قاموس السياق</Link>

        <Link href="/ask">اسأل ضاديوم</Link>

      </div>

<Link href="/courses">الدورات</Link>
    </nav>
  );
}