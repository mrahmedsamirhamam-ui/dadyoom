import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";
import NotificationBell from "@/components/notifications/NotificationBell";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

const links = [
  {href:"/courses",label:"المناهج"},
  {href:"/journey",label:"رحلتي"},
  {href:"/skills",label:"المهارات الأربع"},
  {href:"/reading-challenge",label:"تحدي القراءة"},
  {href:"/dictionary",label:"قاموس السياق"},
  {href:"/ask",label:"اسأل ضاد"},
];
function destination(role: string | null) {
  switch(role?.trim().toLowerCase()) {
    case "teacher": return "/teacher";
    case "parent": return "/parent";
    case "school": return "/school";
    case "admin": return "/admin";
    case "child": return "/child";
    default: return "/student";
  }
}

export default async function Navbar() {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  const {data:profile}=user ? await db.from("profiles")
    .select("role,full_name").eq("id",user.id).maybeSingle() : {data:null};
  const name=profile?.full_name?.trim()||"حسابي";
  const href=destination(profile?.role??null);

  return (
    <header dir="rtl" className="sticky top-0 z-40 border-b border-[#e1e9e3] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <DadyoomLogo />
        <span className="mr-auto hidden max-w-[10rem] truncate text-xs text-[#627a70] sm:block">{name}</span>
        {user ? <>
          <Link href={href} className="inline-flex min-h-10 items-center rounded-xl bg-[#17564b] px-4 py-2 text-sm font-bold text-white">غرفتي</Link>
          <NotificationBell />
          <LogoutButton compact />
        </> : <>
          <Link href="/login" className="rounded-xl border px-4 py-2 text-sm font-semibold">الدخول</Link>
          <Link href="/signup" className="rounded-xl bg-[#17564b] px-4 py-2 text-sm font-bold text-white">حساب جديد</Link>
        </>}
      </div>
      <details className="mx-auto max-w-6xl px-4 pb-2 text-sm sm:px-6">
        <summary className="w-fit cursor-pointer py-1 font-semibold text-[#526c60]">القائمة</summary>
        <nav aria-label="القائمة الرئيسية" className="mt-2 flex flex-wrap gap-2 pb-2">
          {links.map(item=><Link key={item.href} href={item.href}
            className="rounded-xl border border-[#dce8df] bg-[#fbfdfa] px-3 py-2 text-[#245348]">
              {item.label}
            </Link>)}
        </nav>
      </details>
    </header>
  );
}
