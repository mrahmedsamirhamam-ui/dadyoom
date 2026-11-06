import Link from "next/link";
import { redirect } from "next/navigation";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
import { createClient } from "@/lib/supabase/server";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";

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

const roleLabels: Record<PortalRole, string> = {
  student: "مساحة الطالب",
  teacher: "مساحة المعلم",
  parent: "مساحة ولي الأمر",
  school: "مساحة المدرسة",
};

/** The first screen on mobile should expose the actual daily actions, not commercial links. */
const primaryHrefs: Record<PortalRole, readonly string[]> = {
  student: ["/student", "/courses", "/journey", "/skills"],
  teacher: ["/teacher", "/teacher/classroom", "/courses", "/skills"],
  parent: ["/parent", "/courses", "/skills", "/ask"],
  school: ["/school", "/school/reports", "/courses", "/ask"],
};

const roleMessages: Record<PortalRole, string> = {
  student:
    "تعلّم من منهجك، وتدرّب على المهارات الأربع، وتابع تقدّمك، واستعن بضاد للفهم.",
  teacher:
    "تابع طلابك وفصولك وأثرِ الدروس الجاهزة دون إعادة بناء المنهج من الصفر.",
  parent:
    "تابع رحلة أبنائك وتقدمهم ومواطن القوة والاحتياج من مكان واحد.",
  school:
    "تابع المعلمين والطلاب والفصول والتقارير واتخذ قرارات مبنية على تقدم حقيقي.",
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

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "صديق العربية";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#fbf6ea]"
    >
      <section className="border-b border-[#dfcfad] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <DadyoomLogo href="/my" className="ml-auto" />

            <div className="rounded-full border border-[#d5c199] bg-[#fff8e9] px-4 py-2 text-xs font-black text-[#785e2f]">
              {roleLabels[role]}
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

          <div className="mt-5 grid gap-4 rounded-[2rem] border border-[#d7c49d] bg-[#123f39] p-5 text-white shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-xs font-black text-[#f5cf7a]">
                {roleLabels[role]}
              </div>

              <h1 className="mt-2 font-arabic-display text-2xl font-black sm:text-3xl">
                أهلًا {displayName}
              </h1>

              <p className="mt-2 max-w-3xl font-arabic-reading text-base leading-8 text-[#e4efeb]">
                {roleMessages[role]}
              </p>
            </div>

            <Link
              href="/ask"
              className="rounded-full bg-[#f5cf7a] px-5 py-3 text-sm font-black text-[#123f39] transition hover:brightness-95"
            >
              اسأل ضاد
            </Link>
          </div>

          <nav aria-label={roleLabels[role]} className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {primaryHrefs[role]
                .map(href => links.find(item => item.href === href))
                .filter((item): item is PortalLink => Boolean(item))
                .map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbdccf] bg-white px-3 py-3 text-center text-sm font-bold text-[#174f47] shadow-sm transition hover:bg-[#eaf4ed] focus-visible:outline-4 focus-visible:outline-[#d5ad59]">
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
            </div>
            {links.some(item => !primaryHrefs[role].includes(item.href)) && (
              <details className="group rounded-xl border border-[#ddcbaa] bg-[#fffdf8]">
                <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 py-3 text-sm font-bold text-[#315c4b] focus-visible:outline-4 focus-visible:outline-[#d5ad59]">
                  <span>المزيد من خدمات {roleLabels[role]}</span><span aria-hidden="true">⌄</span>
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
        </div>
      </section>

      <div className="role-portal-body dadyoom-arabic-surface w-full min-w-0 max-w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
