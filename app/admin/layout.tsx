import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Bot, CreditCard, GraduationCap, LayoutDashboard, Layers, LibraryBig, Settings2, Users, Wallet } from "lucide-react";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

const sections = [
  { title: "المحتوى والمناهج", items: [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/admin/curriculum", label: "بوابة المناهج", icon: Layers },
    { href: "/admin/curriculum/packs", label: "حزم المناهج", icon: LibraryBig },
    { href: "/admin/lessons", label: "الدروس", icon: BookOpen },
  ] },
  { title: "المجتمع التعليمي", items: [
    { href: "/admin/students", label: "الطلاب", icon: GraduationCap },
    { href: "/admin/teachers", label: "المعلمون", icon: Users },
    { href: "/admin/ai-lesson", label: "مساعد المحتوى", icon: Bot },
  ] },
  { title: "الخدمات", items: [
    { href: "/admin/payments", label: "المدفوعات والاستلام", icon: CreditCard },
    { href: "/admin/subscriptions", label: "الاشتراكات والعروض", icon: Wallet },
    { href: "/admin/monetization", label: "تحقيق الدخل", icon: Settings2 },
  ] },
];
const mobileItems = sections.flatMap((section) => section.items);

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role,full_name").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");
  const displayName = profile.full_name?.trim() || user.email?.split("@")[0] || "مدير ضاديوم";

  return (
    <div dir="rtl" className="dadyoom-management min-h-screen bg-[#f7f9f6] text-[#24382f]">
      <a href="#admin-content" className="sr-only rounded-lg bg-[#123f39] p-3 text-white focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[70]">تجاوز إلى محتوى الإدارة</a>
      <header className="sticky top-0 z-40 border-b border-[#dfe9e2] bg-white/95 shadow-[0_3px_22px_rgba(18,63,57,.05)] backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <DadyoomLogo className="shrink-0" />
            <div className="hidden border-r border-[#dfe9e2] pr-4 md:block">
              <p className="text-sm font-bold text-[#174f47]">مركز إدارة ضاديوم</p>
              <p className="text-xs text-[#687e72]">بيت العربية الرقمي</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <div className="hidden max-w-[17rem] text-left sm:block" dir="auto">
              <p className="break-words text-xs font-semibold leading-5 text-[#244e41]" title={displayName}>{displayName}</p>
              <p className="text-xs text-[#687e72]">مدير المنصة</p>
            </div>
            <Link href="/courses" className="inline-flex min-h-11 items-center rounded-xl border border-[#d5e3da] bg-white px-4 text-sm font-semibold text-[#174f47] transition hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#174f47]">عرض المنصة</Link>
            <LogoutButton compact />
          </div>
        </div>
      </header>
      <nav aria-label="روابط الإدارة للأجهزة الصغيرة" className="flex gap-2 overflow-x-auto border-b border-[#dfe9e2] bg-white px-4 py-2 lg:hidden">
        {mobileItems.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-[#e1eae4] px-3 text-xs font-semibold text-[#345a50] hover:bg-[#edf5f0] focus-visible:outline-2 focus-visible:outline-[#174f47]">
            <Icon size={16} aria-hidden="true" />{label}
          </Link>
        ))}
      </nav>
      <div className="mx-auto flex max-w-[1600px] items-start">
        <aside className="sticky top-[78px] hidden h-[calc(100vh-78px)] w-64 shrink-0 flex-col overflow-y-auto border-l border-[#dfe9e2] bg-white px-4 py-6 lg:flex">
          <p className="rounded-xl bg-[#edf5f0] p-4 text-sm font-bold text-[#174f47]">لوحة التحكم</p>
          <div className="mt-5 space-y-6">
            {sections.map((section) => (
              <section key={section.title} aria-label={section.title}>
                <h2 className="mb-2 px-3 text-xs font-bold text-[#72877b]">{section.title}</h2>
                <div className="space-y-1">
                  {section.items.map(({ href, label, icon: Icon }) => (
                    <Link href={href} key={href} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#415c50] transition hover:bg-[#edf5f0] hover:text-[#123f39] focus-visible:outline-2 focus-visible:outline-[#174f47]">
                      <Icon size={18} aria-hidden="true" className="text-[#5d8776]" />{label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <p className="mt-auto border-t border-[#e6eee9] pt-5 text-xs leading-6 text-[#71877b]">اللغة العربية أسهل في ضاديوم</p>
        </aside>
        <main id="admin-content" tabIndex={-1} className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
