import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSupportTicket } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ticket = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  category: string;
  user_role: string;
  subject: string;
  message: string;
  page_url: string | null;
  status: string;
  admin_note: string;
};

const categories: Record<string, string> = {
  general: "استفسار عام", technical: "مشكلة تقنية", account: "الحساب والدخول",
  curriculum: "مناهج ودروس", teacher: "دعم معلم", school: "مدرسة",
  privacy: "الخصوصية", suggestion: "مقترح", other: "أخرى",
};
const statuses: Record<string, string> = {
  new: "جديد", in_progress: "قيد المتابعة", resolved: "تم الحل",
};
function safeLink(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : null;
  } catch { return null; }
}
function RequestError({ message }: { message: string }) {
  return <section className="mx-auto max-w-6xl p-6" dir="rtl">
    <h1 className="text-3xl font-black text-[#123f39]">رسائل الدعم والتواصل</h1>
    <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      {message}
    </p>
  </section>;
}

export default async function AdminSupportPage() {
  const { user, profile } = await getDashboardRequestViewer();
  if (!user || profile?.role?.trim().toLowerCase() !== "admin") redirect("/");

  const db = createAdminClient();
  const result = await db.from("support_tickets")
    .select("id,created_at,name,email,category,user_role,subject,message,page_url,status,admin_note", { count: "exact" })
    .order("created_at", { ascending: false }).limit(100);
  if (result.error) {
    console.error("SUPPORT_ADMIN_LIST_ERROR", result.error.code);
    return <RequestError message="تعذر تحميل صندوق الوارد. لم يتم تغيير أي طلب." />;
  }
  const tickets = (result.data ?? []) as Ticket[];
  const total = result.count ?? tickets.length;
  const newCount = tickets.filter(ticket => ticket.status === "new").length;

  return (
    <section dir="rtl" className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6">
        <p className="text-xs font-black text-[#a7772f]">ضاديوم • دعم المستخدمين</p>
        <h1 className="mt-2 font-arabic-display text-3xl font-black text-[#123f39]">
          صندوق وارد التواصل والمشكلات
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#625b51]">
          هذه الرسائل خاصة بالإدارة، وتحتوي على معلومات اتصال شخصية. لا تُشاركها مع أطراف خارجية
          ولا تضع كلمات المرور أو البيانات الحساسة في ملاحظات المتابعة.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-xl bg-[#edf5f1] px-4 py-3">إجمالي الطلبات: {total}</span>
          <span className="rounded-xl bg-[#fff3d6] px-4 py-3">طلبات جديدة في آخر {tickets.length}: {newCount}</span>
          <Link href="/contact" className="rounded-xl border border-[#174f47] px-4 py-3 text-[#174f47]">
            عرض صفحة التواصل العامة
          </Link>
        </div>
        {total > tickets.length ? (
          <p className="mt-3 text-xs text-amber-900">يعرض الصندوق أحدث 100 طلب؛ توجد طلبات أقدم لا تظهر هنا.</p>
        ) : null}
      </div>
      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-[#ddcfb4] bg-white p-8 text-[#635b4f]">
          لا توجد رسائل حتى الآن. ستظهر الرسائل التي تصل من صفحة تواصل معنا هنا.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <article key={ticket.id} className="rounded-[1.7rem] border border-[#ddcfb4] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f5eddc] px-3 py-1 text-xs font-black text-[#725b2b]">
                      {categories[ticket.category] ?? ticket.category}
                    </span>
                    <span className="rounded-full bg-[#edf5f1] px-3 py-1 text-xs font-bold text-[#174f47]">
                      {statuses[ticket.status] ?? ticket.status}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-black text-[#123f39]">{ticket.subject}</h2>
                  <p className="mt-2 text-sm text-[#655c51]">
                    {ticket.name} • <a href={"mailto:" + ticket.email} dir="ltr" className="underline">{ticket.email}</a>
                  </p>
                </div>
                <div className="text-left text-xs text-[#807462]">
                  <p dir="ltr">#{ticket.id.slice(0, 8).toUpperCase()}</p>
                  <time dateTime={ticket.created_at}>
                    {new Date(ticket.created_at).toLocaleString("ar-BH", { timeZone: "Asia/Bahrain" })}
                  </time>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#f7f1e6] p-4 text-sm leading-8 text-[#463e35]">
                {ticket.message}
              </p>
              {safeLink(ticket.page_url) ? (
                <a href={safeLink(ticket.page_url) ?? "#"} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-block break-all text-xs font-bold text-[#174f47] underline" dir="ltr">
                  {ticket.page_url}
                </a>
              ) : null}
              <form action={updateSupportTicket} className="mt-5 flex flex-col gap-3 border-t border-[#e6dbc7] pt-5">
                <input type="hidden" name="id" value={ticket.id} />
                <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <label className="text-xs font-bold text-[#174f47]">الحالة
                    <select name="status" defaultValue={ticket.status}
                      className="mt-2 w-full rounded-xl border border-[#d7c8a8] bg-white px-3 py-2.5">
                      <option value="new">جديد</option>
                      <option value="in_progress">قيد المتابعة</option>
                      <option value="resolved">تم الحل</option>
                    </select>
                  </label>
                  <label className="text-xs font-bold text-[#174f47]">ملاحظات داخلية (لا تظهر للمستخدم)
                    <textarea name="admin_note" defaultValue={ticket.admin_note ?? ""} maxLength={2000} rows={2}
                      className="mt-2 w-full rounded-xl border border-[#d7c8a8] bg-white px-3 py-2.5" />
                  </label>
                </div>
                <button type="submit" className="self-start rounded-xl bg-[#174f47] px-5 py-2.5 text-sm font-black text-white">
                  حفظ المتابعة
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
