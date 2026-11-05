import Link from "next/link";
import { redirect } from "next/navigation";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import { createClient } from "@/lib/supabase/server";

export type PortalRole = "student" | "teacher" | "parent" | "school";
export type PortalLink = { href: string; label: string; icon: string };

const destinations: Record<string,string> = {
  student:"/student", child:"/child", teacher:"/teacher",
  parent:"/parent", school:"/school", admin:"/admin",
};
const roleLabels: Record<PortalRole,string> = {
  student:"مساحة الطالب", teacher:"مساحة المعلم",
  parent:"مساحة ولي الأمر", school:"مساحة المدرسة",
};
const primary: Record<PortalRole,string[]> = {
  student:["/student","/courses","/student/classroom","/ask"],
  teacher:["/teacher","/teacher/classroom","/courses","/teacher/academy"],
  parent:["/parent","/courses","/ask"],
  school:["/school","/courses","/ask"],
};

export default async function RolePortalLayout({role,links,children}:{
  role: PortalRole; links: PortalLink[]; children: React.ReactNode
}) {
  const db = await createClient();
  const {data:{user},error:userError} = await db.auth.getUser();
  if(userError||!user)redirect("/login");
  const {data:profile,error:profileError}=await db.from("profiles")
    .select("full_name,role,country").eq("id",user.id).maybeSingle();
  if(profileError)throw new Error("تعذر تحميل ملفك.");
  const actualRole=profile?.role?.trim().toLowerCase()??"";
  if(actualRole!==role&&actualRole!=="admin")redirect(destinations[actualRole]??"/onboarding");
  const name=profile?.full_name?.trim() || "صديق العربية";
  const shortcuts=primary[role].map(href=>
    links.find(link=>link.href===href) ??
    (href==="/ask"?{href,label:"اسأل ضاد",icon:""}:null)
  ).filter((link):link is PortalLink=>Boolean(link));
  const others=links.filter(link=>!shortcuts.some(shortcut=>shortcut.href===link.href));

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8faf9]">
      <div className="border-b border-[#e5ebe6] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <DadyoomLogo />
          <span className="rounded-lg bg-[#f1f6f2] px-3 py-1.5 text-xs font-semibold text-[#477368]">
            {roleLabels[role]}
          </span>
          <span className="mr-auto text-sm font-semibold text-[#345a50]">{name}</span>
        </div>
        <nav aria-label={roleLabels[role]} className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
          {shortcuts.map(link=><Link key={link.href} href={link.href}
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-[#dce8df] bg-[#fbfdfa] px-4 py-2.5 text-sm font-semibold text-[#245348] focus-visible:outline-2 focus-visible:outline-[#17564b]">
            {link.label}</Link>)}
        </nav>
        {others.length>0 ? <details className="mx-auto max-w-6xl px-4 pb-3 text-sm sm:px-6">
          <summary className="w-fit cursor-pointer text-sm font-medium text-[#617d70]">المزيد من الأدوات</summary>
          <nav aria-label="الأدوات الإضافية" className="mt-3 flex flex-wrap gap-2">
            {others.map(link=><Link key={link.href} href={link.href}
              className="rounded-lg border border-[#e1e9e3] bg-white px-3 py-2 text-[#345c50]">{link.label}</Link>)}
          </nav>
        </details> : null}
      </div>
      <div className="role-portal-body dadyoom-arabic-surface min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
