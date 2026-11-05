import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Classroom = { id: string; name: string; is_active: boolean };

export default async function TeacherHome() {
  const db = await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user)redirect("/login");
  const {data:profile}=await db.from("profiles")
    .select("full_name,role").eq("id",user.id).maybeSingle();
  const role=profile?.role?.trim().toLowerCase();
  if(role!=="teacher"&&role!=="admin")redirect("/student");
  const {data:classes,error}=await db.from("teacher_classes")
    .select("id,name,is_active").eq("teacher_id",user.id)
    .order("created_at",{ascending:false}).limit(8);
  const teacherClasses=(classes??[]) as Classroom[];

  return (
    <main dir="rtl" className="min-h-[65vh] bg-[#f8faf9] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-[#e1ebe5] bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold text-[#47766a]">ضاديوم · غرفة المعلم</p>
          <h1 className="mt-2 text-2xl font-bold text-[#19362f] sm:text-3xl">
            أهلًا {profile?.full_name || "معلم العربية"}
          </h1>
          <p className="mt-2 leading-8 text-[#61736b]">فصولك ومناهجك في مكان واضح، دون ازدحام الأدوات.</p>
          <Link href="/teacher/classroom"
            className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#17564b] px-6 py-3 font-bold text-white">
            افتح فصولي
          </Link>
        </header>
        <nav aria-label="اختصارات المعلم" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {href:"/courses",title:"المناهج"},
            {href:"/teacher/academy",title:"تدريب المعلم"},
            {href:"/teacher/details",title:"الإدارة والتقارير"},
          ].map(link=><Link key={link.href} href={link.href}
            className="rounded-2xl border border-[#e1ebe5] bg-white p-5 font-bold text-[#245348]">
            {link.title}
          </Link>)}
        </nav>
        <section className="rounded-3xl border border-[#e1ebe5] bg-white p-5 sm:p-7">
          <h2 className="text-xl font-bold text-[#19362f]">فصولي</h2>
          {error ? <p role="alert" className="mt-3 text-sm text-rose-700">تعذر تحميل الفصول الآن.</p> : null}
          {teacherClasses.length ? <div className="mt-3 divide-y divide-[#e8eee9]">
            {teacherClasses.map(item=><Link key={item.id} href="/teacher/classroom"
              className="flex min-h-12 items-center justify-between gap-2 py-3">
              <span className="font-semibold">{item.name}</span>
              <span className="text-xs text-[#61736b]">{item.is_active?"نشط":"غير نشط"}</span>
            </Link>)}
          </div> : <p className="mt-3 text-sm leading-7 text-[#61736b]">
            لا توجد فصول مرتبطة بحسابك حاليًا.
          </p>}
        </section>
      </div>
    </main>
  );
}
