import Link from "next/link";
import { redirect } from "next/navigation";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
import RoleWelcomeTour from "@/components/roles/RoleWelcomeTour";
import { PORTAL_EXPERIENCE } from "@/lib/ui/portal-experience";
import { createClient } from "@/lib/supabase/server";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";
import { hasVerifiedPrivilegedRole } from "@/lib/auth/pending-role-request";

export type PortalRole =
  | "student"
  | "teacher"
  | "parent"
  | "school";

export type PortalLink = {
  href: string;
  label: string;
  icon: string;
};

/** The first screen on mobile should expose the actual daily actions, not commercial links. */
const primaryHrefs: Record<PortalRole, readonly string[]> = {
  student: ["/student", "/courses", "/journey", "/skills"],
  teacher: ["/teacher", "/teacher/classroom", "/courses", "/skills"],
  parent: ["/parent", "/courses", "/skills", "/ask"],
  school: ["/school", "/school/reports", "/courses", "/ask"],
};

export default async function RolePortalLayout({
  role,
  links,
  children,
}: {
  role: PortalRole;
  links: PortalLink[];
  children: React.ReactNode;
}) {
  const experience = PORTAL_EXPERIENCE[role];
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
    .select("full_name,role,country")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const actualRole =
    profile?.role
      ?.trim()
      .toLowerCase() ?? "";

  if (
    actualRole !== role &&
    actualRole !== "admin"
  ) {
    redirect(destinationForStoredRole(actualRole));
  }

  // Server-side gate for privileged portal data, not just navigation links.
  if (
    (role === "teacher" || role === "school") &&
    actualRole !== "admin" &&
    !(await hasVerifiedPrivilegedRole(supabase, user.id, actualRole))
  ) {
    redirect("/account/role-status");
  }

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "صديق العربية";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f7f9f6]"
    >
      <section className="border-b border-[#dce5df] bg-[#f7f9f6]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <DadyoomLogo href="/my" className="ml-auto" />

            <div className="rounded-full border border-[#d8c38d] bg-[#fff8e8] px-4 py-2 text-xs font-bold text-[#65491a]">
              {experience.title}
            </div>

            <div className="text-left">
              <div className="max-w-48 truncate text-sm font-black text-[#123f39]">
                {displayName}
              </div>
              <div className="text-[11px] font-bold text-[#837666]">
                {profile?.country ||
                  "بيت العربية الرقمي"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-3xl border border-[#2d5264] bg-[#17324d] p-5 text-white shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold text-[#f3d99d]">
                {experience.title}
              </p>

              <h1 className="mt-2 font-arabic-display text-2xl font-bold sm:text-3xl">
                {experience.welcome}
              </h1>
              <p className="mt-1 text-sm text-[#e8eff2]">{displayName}</p>
              <p className="mt-3 max-w-3xl font-arabic-reading text-base leading-8 text-[#eef5f3]">
                {experience.subtitle}
              </p>
            </div>

            <Link
              href={experience.primaryAction.href}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e7c77a] px-5 py-3 text-sm font-bold text-[#17324d] transition hover:bg-[#f4da99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffffff]"
            >
              {experience.primaryAction.title}
            </Link>
          </div>

          <nav aria-label={experience.title + " — الوصول السريع"} className="mt-5 space-y-3">
            <h2 className="font-arabic-display text-lg font-bold text-[#17324d]">الوصول السريع</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {primaryHrefs[role]
                .map(href => links.find(item => item.href === href))
                .filter((item): item is PortalLink => Boolean(item))
                .map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbdcd5] bg-white px-3 py-3 text-center text-sm font-bold text-[#164f47] shadow-sm transition hover:bg-[#edf5f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20645b] last:col-span-2 sm:last:col-span-1">
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Link>
                ))}
            </div>
            {links.some(item => !primaryHrefs[role].includes(item.href)) && (
              <details className="group rounded-xl border border-[#ddcbaa] bg-[#fffdf8]">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 py-3 text-sm font-bold text-[#315c4b] focus-visible:outline-4 focus-visible:outline-[#d5ad59]">
                  <span>المزيد من خدمات {experience.title}</span><span aria-hidden="true">⌄</span>
                </summary>
                <div className="grid gap-2 border-t border-[#eee1cc] p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {links.filter(item => !primaryHrefs[role].includes(item.href)).map(item => (
                    <Link key={item.href} href={item.href}
                      className="flex min-h-11 items-center gap-2 rounded-lg bg-[#f6f8f3] px-4 py-3 text-sm font-semibold text-[#315c4b] hover:bg-[#eaf4ed]">
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </details>
            )}
          </nav>
          <RoleWelcomeTour role={role} />
        </div>
      </section>

      <div className="role-portal-body dadyoom-arabic-surface w-full min-w-0 max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
