import Link from "next/link";
import { redirect } from "next/navigation";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LogoutButton from "@/components/auth/LogoutButton";
import CompactNavigation from "@/components/navigation/CompactNavigation";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";

const adminLinks = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/curriculum", label: "بوابة المناهج" },
  { href: "/admin/curriculum/packs", label: "حزم المناهج" },
  { href: "/admin/curriculum/coverage", label: "تدقيق كتب البحرين" },
  { href: "/admin/lessons", label: "الدروس" },
  { href: "/admin/students", label: "الطلاب" },
  { href: "/admin/teachers", label: "المعلمون" },
  { href: "/admin/ai-lesson", label: "مساعد المحتوى" },
  { href: "/admin/support", label: "التواصل والدعم" },
  { href: "/admin/payments", label: "المدفوعات والاستلام" },
  { href: "/admin/subscriptions", label: "الاشتراكات والعروض" },
  { href: "/admin/monetization", label: "تحقيق الدخل" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Share one request-scoped user/profile lookup across admin nested routes.
  // This avoids redundant auth round trips; the role authorization below stays.
  const { user, userError, profile, profileError } =
    await getDashboardRequestViewer();

  if (userError || !user) {
    redirect("/login");
  }

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
        <div className="mx-auto flex w-full max-w-none flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <DadyoomLogo className="ml-auto" />

          <div className="hidden rounded-full border border-[#d7c49d] bg-[#fff9ed] px-3 py-2 text-xs font-black text-[#745b30] sm:block">
            الإدارة
          </div>

          <CompactNavigation items={adminLinks} label="أقسام الإدارة" id="admin-navigation" />

          <div className="mr-auto flex flex-wrap items-center gap-2">
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
              prefetch={false}
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
