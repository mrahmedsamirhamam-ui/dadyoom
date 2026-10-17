import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "ضاديوم حسابات — طلباتي ومدفوعاتي",
  description: "لوحة ضاديوم المستقلة لعرض حالة الطلبات والمدفوعات دون إنشاء عمليات دفع جديدة.",
  robots: { index: false, follow: false },
};

type Order = {
  id: string; kind: string; amount: number | string; currency: string;
  provider: string; status: string; created_at: string; bank_reference: string | null;
};
const labels: Record<string, string> = {
  pending: "طلب بانتظار المراجعة — غير مدفوع أو غير مؤكد",
  approved: "مرجع أُرسل للمراجعة — لا يعني تأكيد استلام المال",
  completed: "عملية مكتملة بعد التحقق",
  failed: "فشلت العملية",
  cancelled: "طلب ملغى",
  refunded: "تم رد المبلغ",
};
function amount(n: number | string, c: string) {
  const value = Number(n);
  return Number.isFinite(value) ? value.toFixed(c === "BHD" ? 3 : 2) + " " + c : "غير متاح";
}

export default async function DadyoomOwnBillingPage() {
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) redirect("/login");
  // RLS restricts every row to the signed-in buyer even if filters regress.
  const { data, error } = await db.from("edu_payment_orders")
    .select("id,kind,amount,currency,provider,status,created_at,bank_reference")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const orders = (data ?? []) as Order[];
  return <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#123f39]">
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="flex flex-wrap gap-4 text-sm font-bold">
        <Link href="/pricing" className="underline">خطة ضاديوم</Link>
        <Link href="/courses" className="underline">المناهج والدروس</Link>
      </nav>
      <header className="rounded-3xl bg-[#123f39] p-7 text-white">
        <p className="text-sm font-black text-[#f4d58a]">Dadyoom Accounts — ضاديوم حسابات</p>
        <h1 className="mt-2 text-3xl font-black">طلباتك داخل ضاديوم</h1>
        <p className="mt-3 leading-8">
          هذه لوحة معاملات خاصة بضاديوم، ولا تستخدم Paddle لعرض بياناتك.
          لا نطلب أرقام البطاقات ولا نخصم أي مبلغ من هذه الصفحة.
        </p>
      </header>
      <section className="rounded-2xl border border-[#dac9a9] bg-white p-5">
        <h2 className="text-xl font-black">حالة المدفوعات</h2>
        <p className="mt-2 leading-8">
          الاشتراكات المدفوعة الجديدة متوقفة. أي طلب «معلّق» أو «مرسل للمراجعة»
          ليس إثباتًا للشراء، ولا تُفتح الحقوق المدفوعة إلا بعد تأكيد الاستلام
          والتحقق الإداري. يحتفظ أصحاب الاشتراكات القديمة بحق إدارة الاشتراك وإلغائه
          من صفحة الخطة دون تعطيل تلك الحقوق.
        </p>
      </section>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-5 font-bold text-red-800">
        تعذر قراءة طلباتك بأمان. لا نعرض نتائج غير مؤكدة.
      </p>}
      {!error && orders.length === 0 && <p className="rounded-xl bg-white p-5">
        ليس لديك طلبات مسجلة. المذاكرة الأساسية متاحة مجانًا.
      </p>}
      <section aria-label="سجل طلباتك" className="space-y-3">
        {orders.map(order => <article key={order.id} className="rounded-2xl border border-[#dac9a9] bg-white p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <p className="font-black">{order.kind === "course" ? "طلب دورة تعليمية" : "طلب خطة ضاديوم"}</p>
            <p className="font-black">{amount(order.amount, order.currency)}</p>
          </div>
          <p className="mt-2 text-sm font-bold text-[#6f604d]">
            الحالة: {labels[order.status] ?? "تحتاج مراجعة"}
          </p>
          <p className="mt-1 text-xs text-[#786c58]">
            رقم الطلب: {order.id} — الطريقة المسجلة: {order.provider}
          </p>
          {order.bank_reference && <p className="mt-2 text-sm">
            المرجع المُقدَّم: {order.bank_reference} (لا يثبت وصول الحوالة)
          </p>}
        </article>)}
      </section>
    </div>
  </main>;
}
