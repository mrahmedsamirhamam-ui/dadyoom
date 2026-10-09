import { LocalizedText } from "@/components/i18n/LanguageProvider";
import NotificationBell from "@/components/notifications/NotificationBell";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/curriculum", label: "مناهج الدول", en: "Curricula" },
  { href: "/courses", label: "المستكشف", en: "Course explorer" },
  { href: "/learn-arabic", label: "دليل العربية", en: "Learn Arabic" },
  { href: "/about", label: "عن ضاديوم", en: "About" },
  { href: "/journey", label: "رحلتي", en: "My journey" },
  { href: "/skills", label: "المهارات الأربع", en: "Four skills" },
  { href: "/reading-challenge", label: "تحدي القراءة", en: "Reading challenge" },
  { href: "/rewards", label: "الجوائز والشهادات", en: "Rewards" },
  { href: "/dictionary", label: "قاموس السياق", en: "Dictionary" },
  { href: "/ask", label: "اسأل ضاد", en: "Ask Dad" },
];

function dashboardForRole(role?: string | null) {
  switch (role?.trim().toLowerCase()) {
    case "teacher":
      return { href: "/teacher", label: "لوحة المعلم", en: "Teacher dashboard" };
    case "parent":
      return { href: "/parent", label: "لوحة ولي الأمر", en: "Parent dashboard" };
    case "school":
      return { href: "/school", label: "لوحة المدرسة", en: "School dashboard" };
    case "admin":
      return { href: "/admin", label: "لوحة الإدارة", en: "Admin dashboard" };
    default:
      return { href: "/student", label: "لوحتي", en: "My dashboard" };
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
      className="sticky top-0 z-40 border-b border-[#dfcfaf] bg-[#fffdf7]/95 shadow-[0_8px_30px_rgba(38,63,55,.06)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <DadyoomLogo className="ml-auto" />

        <nav
          aria-label="Main navigation / التنقل الرئيسي"
          className="order-3 flex w-full gap-1 overflow-x-auto pb-1 text-sm font-black text-[#5c554d] lg:order-none lg:w-auto lg:flex-1 lg:justify-center lg:overflow-visible lg:pb-0"
        >
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="whitespace-nowrap rounded-full px-4 py-2.5 transition hover:bg-[#f3ead7] hover:text-[#123f39]"
            >
              <LocalizedText ar={item.label} en={item.en} />
            </Link>
          ))}
                <NotificationBell />
    </nav>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden max-w-40 text-left sm:block">
              <div className="truncate text-xs font-black text-[#315f57]">{displayName}</div>
              <div className="text-[10px] font-bold text-[#8a7c69]">{role === "teacher" ? "معلم" : role === "parent" ? "ولي أمر" : role === "school" ? "مدرسة" : role === "admin" ? "إدارة" : "طالب"}</div>
            </div>
            <Link
              href={dashboard.href}
              prefetch={false}
              className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              <LocalizedText ar={dashboard.label} en={dashboard.en} />
            </Link>
            <LogoutButton compact />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              prefetch={false}
              className="rounded-full border border-[#d7c59f] bg-[#fffaf0] px-4 py-2.5 text-sm font-black text-[#6b5d45] transition hover:border-[#b88a34] hover:text-[#123f39]"
            >
              <LocalizedText ar="دخول" en="Log in" />
            </Link>
            <Link
              href="/signup"
              prefetch={false}
              className="rounded-full bg-[#123f39] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0c332e]"
            >
              <LocalizedText ar="حساب جديد" en="Sign up" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

