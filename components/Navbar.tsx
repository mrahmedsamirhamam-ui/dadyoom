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
    default:
      return { href: "/student", label: "لوحتي" };
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
        <DadyoomLogo className="ml-auto" />

        <nav
          aria-label="التنقل الرئيسي"
          className="order-3 flex w-full gap-1 overflow-x-auto py-1 text-sm font-semibold text-[#416054] lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible"
        >
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-4 py-2.5 transition-colors hover:bg-[#edf5f0] hover:text-[#123f39] focus-visible:outline-2 focus-visible:outline-[#174f47]"
            >
              {item.label}
            </Link>
          ))}
                <NotificationBell />
    </nav>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden max-w-[17rem] min-w-0 text-left sm:block" dir="auto">
              <div className="break-words text-xs font-semibold leading-5 text-[#315f57]" title={displayName}>{displayName}</div>
              <div className="text-[10px] font-bold text-[#8a7c69]">{role === "teacher" ? "معلم" : role === "parent" ? "ولي أمر" : role === "school" ? "مدرسة" : role === "admin" ? "إدارة" : "طالب"}</div>
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
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-[#d7c59f] bg-[#fffaf0] px-4 py-2.5 text-sm font-black text-[#6b5d45] transition hover:border-[#b88a34] hover:text-[#123f39]"
            >
              دخول
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              حساب جديد
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

