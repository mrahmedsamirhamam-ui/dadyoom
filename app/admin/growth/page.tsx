import "server-only";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGrowthAdminBaseline } from "@/lib/growth/admin-baseline";

export const dynamic = "force-dynamic";

function NumberCard({label, value, note}: {
  label: string; value: number | null; note: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d7e4da] bg-white p-5">
      <p className="text-sm font-bold text-[#526f61]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#173f35] tabular-nums">
        {value === null ? "غير متاح" : value.toLocaleString("ar-BH")}
      </p>
      <p className="mt-3 text-xs leading-6 text-[#61786c]">{note}</p>
    </div>
  );
}

export default async function GrowthDashboardPage() {
  // Redundant on purpose: never rely on a middleware or layout alone for a privileged page.
  const session = await createClient();
  const {data:{user}, error} = await session.auth.getUser();
  if (error || !user) redirect("/login");
  const {data:profile,error:profileError} = await session.from("profiles")
    .select("role").eq("id",user.id).maybeSingle();
  if (profileError || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");

  const stats = await getGrowthAdminBaseline();
  const counts = [
    {label:"حسابات المستخدمين (ملفات)",value:stats.profiles,note:"لا يساوي عدد الزيارات أو المستخدمين النشطين"},
    {label:"الطلاب",value:stats.students,note:"حسابات دور الطالب فقط، دون أطفال الدور المنفصل"},
    {label:"حسابات الأطفال",value:stats.childAccounts,note:"تعامل خاص مع الخصوصية وموافقة الأسرة"},
    {label:"المعلمون",value:stats.teachers,note:"ليس عدد المعلمين الذين أسندوا نشاطًا"},
    {label:"أولياء الأمور",value:stats.parents,note:"حسابات الدور وليس عدد الأطفال المرتبطين"},
    {label:"المدارس",value:stats.schools,note:"حسابات، لا تجارب مدرسية ناجحة"},
    {label:"تسجيلات آخر 30 يومًا",value:stats.last30Registrations,note:"ملفات أنشئت خلال 30 يومًا متحركة"},
    {label:"سجلات بدء/تقدم الدروس",value:stats.startedProgressRecords,note:"سجلات، لا عدد الطلاب الفريدين"},
    {label:"السجلات بحالة إكمال",value:stats.completedProgressRecords,note:"راجع صحة انتقال حالة الإكمال قبل استنتاج التفعيل"},
    {label:"محاولات الأنشطة",value:stats.activityAttempts,note:"قد تشمل بيانات تاريخية/غير مرتبطة بمستخدم حالي"},
    {label:"محاولات الألعاب",value:stats.gameAttempts,note:"عدد محاولات مسجّلة، وليس لاعبين مميزين"},
    {label:"واجبات المعلمين",value:stats.teacherAssignments,note:"عدد الإسنادات المخزنة في الجدول القائم"},
  ];

  return (
    <div dir="rtl" className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header>
          <p className="text-sm font-bold text-[#8b6f2e]">لوحة الإدارة / نمو ضاديوم</p>
          <h1 className="mt-2 text-3xl font-black text-[#173f35]">تدقيق النمو والقياس</h1>
          <p className="mt-2 max-w-4xl text-sm leading-8 text-[#526b5d]">
            مؤشرات أصلية من قاعدة البيانات، دون اختلاق زيارات أو نسب احتفاظ.
            أرقام هذا القسم لا تشهد باكتمال المناهج، ولا تساوي عدد المستخدمين النشطين.
          </p>
          <p className="mt-2 text-xs text-[#6b7c71]">
            وقت آخر قراءة: {new Intl.DateTimeFormat("ar-BH",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bahrain"
            }).format(new Date(stats.measuredAt))}
          </p>
        </header>
        <section aria-labelledby="measured">
          <h2 id="measured" className="mb-4 text-xl font-black">المؤشرات المقاسة</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {counts.map((item)=><NumberCard key={item.label} {...item}/>)}
          </div>
        </section>
        <section className="rounded-2xl border border-[#d9d2b9] bg-[#fffdf5] p-6">
          <h2 className="text-xl font-black">نجمة الشمال والأرقام الناقصة</h2>
          <p className="mt-3 leading-8">
            الهدف الرئيسي: عدد الطلاب الذين أتموا ثلاث جلسات تعلم مفيدة في الأسبوع.
            هذا المؤشر غير قابل للحساب بعد دون أحداث جلسة موثوقة وبموافقة مناسبة.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {["نجمة الشمال الأسبوعية","الاحتفاظ D1 / D7 / D30","الزيارات حسب المصدر والدولة","صفحات الخروج","تحويل الزائر إلى حساب","تفاعل ضاد عبر جميع القنوات"].map((label)=>(
              <div key={label} className="rounded-xl border border-[#e0dccd] bg-white p-3 text-sm">
                <strong>{label}</strong>
                <span className="mr-3 text-[#8a5e2e]">غير قابل للقياس الموثوق حاليًا</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7">
            لا تفعّل حملات مدفوعة، ولا تُنشئ مقاييس زائفة من زيارات QR المتكررة أو من سجلات مجهولة.
          </p>
        </section>
        <section className="rounded-2xl bg-[#123f39] p-6 text-white">
          <h2 className="text-xl font-black">أول نجاح بلا تسجيل</h2>
          <p className="mt-2 text-sm leading-7">راجع رحلة الضيف ذات السؤالين، ثم اختبرها على الهاتف قبل نشرها.</p>
          <Link href="/try" className="mt-4 inline-flex rounded-xl bg-[#f5cf7a] px-5 py-3 font-black text-[#173f35]">
            تجربة درس الضيف
          </Link>
        </section>
      </div>
    </div>
  );
}
