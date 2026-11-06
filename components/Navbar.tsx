import NotificationBell from "@/components/notifications/NotificationBell";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/courses", label: "المناهج" },
  { href: "/journey", label: "رحلتي" },
  { href: "/skills", label: "المهارات الأربع" },
  { href: "/reading-challenge", label: "تحدي القراءة" },
  { href: "/dictionary", label: "قاموس السياق" },
  { href: "/ask", label: "اسأل ضاد" },
];

function dashboardForRole(role?: string | null) {
  switch (role?.trim().toLowerCase()) {
    case "teacher":
      return { href: "/teacher", label: "لوحة المعلم" };
    case "parent":
      return { href: "/parent", label: "لوحة ولي الأمر" };
    case "school":
      return { href: "/school", label: "لوحة المدرسة" };
    case "admin":
      return { href: "/admin", label: "لوحة الإدارة" };
    case "child":
      return { href: "/child", label: "مساحة الطفل" };
    case "student":
      return { href: "/student", label: "لوحة الطالب" };
    default:
      return { href: "/my", label: "مساحتي" };
  }
}

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  let displayName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,full_name")
      .eq("id", user.id)
      .maybeSingle();

    role = profile?.role ?? null;
    displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "حسابي";
  }

  const dashboard = dashboardForRole(role);

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-40 border-b border-[#dfe9e2] bg-white/95 shadow-[0_4px_24px_rgba(18,63,57,.05)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <DadyoomLogo href={user ? "/my" : "/"} className="ml-auto" />

        <nav aria-label="تنقل مختصر" className="order-3 flex w-full items-center gap-2 border-t border-[#edf2eb] pt-3 text-sm font-semibold text-[#416054] lg:hidden">
          {links.slice(0, 2).map(item => (
            <Link key={item.href} href={item.href}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#f4f8f3] px-2 py-2.5 text-center hover:bg-[#e7f1e9] focus-visible:outline-2 focus-visible:outline-[#174f47]">
              {item.label}
            </Link>
          ))}
          <details className="group relative flex-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center rounded-xl border border-[#dfe9df] bg-white px-2 py-2.5 text-center font-bold focus-visible:outline-2 focus-visible:outline-[#174f47]">
              المزيد
            </summary>
            <div className="absolute left-0 right-0 top-full z-50 mt-2 grid min-w-[9rem] gap-1 rounded-xl border border-[#dfe9df] bg-white p-2 shadow-lg">
              {links.slice(2).map(item => (
                <Link key={item.href} href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#174f47]">
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <nav aria-label="التنقل الرئيسي" className="hidden flex-1 items-center justify-center gap-1 text-sm font-semibold text-[#416054] lg:flex">
          {links.map(item => (
            <Link key={item.href} href={item.href}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 py-2.5 hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#174f47]">
              {item.label}
            </Link>
          ))}
        </nav>
        {user && <NotificationBell />}

        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden max-w-[17rem] min-w-0 text-left sm:block" dir="auto">
              <div className="break-words text-xs font-semibold leading-5 text-[#315f57]" title={displayName}>{displayName}</div>
              <div className="text-[10px] font-bold text-[#8a7c69]">{role === "teacher" ? "معلم" : role === "parent" ? "ولي أمر" : role === "school" ? "مدرسة" : role === "admin" ? "إدارة" : role === "child" ? "طفل" : "طالب"}</div>
            </div>
            <Link
              href={dashboard.href}
              className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              {dashboard.label}
            </Link>
            <LogoutButton compact />
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[#cbd9cb] bg-white px-5 py-2.5 text-sm font-bold text-[#174f47] hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#174f47]"
          >
            دخول
          </Link>
        )}
      </div>
    </header>
  );
}

