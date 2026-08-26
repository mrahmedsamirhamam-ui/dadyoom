import Link from "next/link";
import { redirect } from "next/navigation";

import DadyoomLogo from "@/components/brand/DadyoomLogo";
import { createClient } from "@/lib/supabase/server";

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

const destinations: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

const roleLabels: Record<PortalRole, string> = {
  student: "مساحة الطالب",
  teacher: "مساحة المعلم",
  parent: "مساحة ولي الأمر",
  school: "مساحة المدرسة",
};

const roleMessages: Record<PortalRole, string> = {
  student:
    "تعلم من منهجك، تدرب على المهارات الأربع، تابع تقدمك واستعن بضاد للفهم.",
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
    redirect(
      destinations[actualRole] ??
        "/"
    );
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
            <DadyoomLogo className="ml-auto" />

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
                أهلاً {displayName}
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

          <nav
            aria-label={roleLabels[role]}
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex shrink-0 items-center gap-2 rounded-full border border-[#ddcbaa] bg-[#fffdf8] px-4 py-2.5 text-sm font-black text-[#5c554c] transition hover:border-[#b68d46] hover:bg-[#fff7e5] hover:text-[#123f39]"
              >
                <span aria-hidden="true">
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="role-portal-body">
        {children}
      </div>
    </div>
  );
}
