import Link from "next/link";
import { redirect } from "next/navigation";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

const adminLinks = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/curriculum", label: "بوابة المناهج" },
  { href: "/admin/curriculum/packs", label: "حزم المناهج" },
  { href: "/admin/lessons", label: "الدروس" },
  { href: "/admin/students", label: "الطلاب" },
  { href: "/admin/teachers", label: "المعلمون" },
  { href: "/admin/ai-lesson", label: "مساعد المحتوى" },
];

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

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    profile?.role?.trim().toLowerCase() !== "admin"
  ) {
    redirect("/");
  }

  const displayName =
    profile.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "مدير ضاديوم";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea] text-[#2b2823]"
    >
      <header className="sticky top-0 z-50 border-b border-[#dfcfaf] bg-[#fffdf7]/95 shadow-[0_8px_30px_rgba(38,63,55,.06)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <DadyoomLogo className="ml-auto" />

          <div className="hidden rounded-full border border-[#d7c49d] bg-[#fff9ed] px-3 py-2 text-xs font-black text-[#745b30] sm:block">
            الإدارة
          </div>

          <nav
            aria-label="إدارة ضاديوم"
            className="order-3 flex w-full gap-1 overflow-x-auto pb-1 text-sm font-black text-[#5c554d] lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible lg:pb-0"
          >
            {adminLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full px-4 py-2.5 transition hover:bg-[#f3ead7] hover:text-[#123f39]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-left sm:block">
              <div className="max-w-36 truncate text-xs font-black text-[#315f57]">
                {displayName}
              </div>
              <div className="text-[10px] font-bold text-[#8a7c69]">
                مدير المنصة
              </div>
            </div>

            <Link
              href="/courses"
              className="rounded-full border border-[#d7c59f] bg-[#fffaf0] px-4 py-2.5 text-sm font-black text-[#6b5d45]"
            >
              عرض المنصة
            </Link>

            <LogoutButton compact />
          </div>
        </div>
      </header>

      <main className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 8% 10%, rgba(198,145,48,.09) 0 1px, transparent 1.8px), radial-gradient(circle at 90% 15%, rgba(18,63,57,.07) 0 1px, transparent 1.8px)",
            backgroundSize: "28px 28px, 36px 36px",
          }}
        />
        {children}
      </main>
    </div>
  );
}
