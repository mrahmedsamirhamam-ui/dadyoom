import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Admin profile error:", profileError.message);
    redirect("/");
  }

  const role = profile?.role?.trim().toLowerCase();

  if (role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <header className="bg-teal-800 text-white shadow">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="text-2xl font-bold">
            ضاديوم | الإدارة
          </Link>

          <nav className="flex flex-wrap gap-5">
            <Link href="/admin">الرئيسية</Link>
            <Link href="/admin/courses">الدورات</Link>
            <Link href="/admin/lessons">الدروس</Link>
            <Link href="/admin/students">الطلاب</Link>
            <Link href="/admin/teachers">المعلمون</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}