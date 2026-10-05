import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "تواصل مع ضاديوم",
  description:
    "قنوات التواصل والدعم في ضاديوم للحسابات والتعلم والمدفوعات والخصوصية والمدارس.",
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    title: "الحساب والتعلّم",
    body: "إذا كانت المشكلة في الدخول أو الصف أو التقدم أو درس معين، استخدم قنوات الدعم المتاحة داخل حساب ضاديوم مع وصف واضح للمشكلة. لا ترسل كلمة المرور أو رموز التحقق لأي شخص.",
  },
  {
    title: "المدارس والمعلمون",
    body: "يمكن للمدارس والمعلمين استخدام مساحاتهم داخل ضاديوم لمتابعة الصفوف والدورات والاجتماعات والحصص المباشرة. عند طلب دعم مؤسسي، اذكر اسم المدرسة والدور ونوع المشكلة من دون مشاركة بيانات طلاب غير لازمة.",
  },
  {
    title: "الفوترة وPlus",
    body: "تتم معالجة اشتراك ضاديوم Plus عبر Paddle بصفتها Merchant of Record. استخدم أدوات إدارة الاشتراك داخل الحساب، ويمكن الرجوع إلى دعم Paddle في المسائل المرتبطة بالفاتورة أو وسيلة الدفع. ضاديوم لا يطلب بيانات البطاقة الكاملة عبر الرسائل.",
  },
  {
    title: "الخصوصية والبيانات",
    body: "لطلب الوصول إلى بيانات الحساب أو تصحيحها أو حذفها حيث يسمح القانون، استخدم قناة الدعم داخل ضاديوم وحدد أن الطلب متعلق بالخصوصية. قد نحتاج إلى التحقق من هوية صاحب الحساب قبل تنفيذ طلب حساس.",
  },
];

export default function ContactPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-black text-[#123f39]">ضاديوم</Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/about" className="text-[#174f47] hover:underline">عن ضاديوم</Link>
            <Link href="/privacy" className="text-[#174f47] hover:underline">الخصوصية</Link>
            <Link href="/refund-policy" className="text-[#174f47] hover:underline">الاسترداد</Link>
          </nav>
        </div>

        <article className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#a7772f]">QAMORYX Technologies W.L.L</p>
          <h1 className="mt-2 font-arabic-display text-4xl font-black text-[#123f39]">تواصل مع ضاديوم</h1>
          <p className="mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#625b51]">
            نريد أن يصل طلبك إلى المسار الصحيح من أول مرة. اختر نوع المساعدة أدناه،
            ثم استخدم قنوات الدعم المتاحة داخل حساب ضاديوم. هذه الصفحة عامة حتى يعرف
            الزائر قبل التسجيل كيف نتعامل مع الحسابات والتعلم والمدفوعات والخصوصية.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {channels.map((item) => (
              <section key={item.title} className="rounded-2xl border border-[#e1d4ba] bg-[#f8f1e5] p-5">
                <h2 className="text-xl font-black text-[#123f39]">{item.title}</h2>
                <p className="mt-3 font-arabic-reading leading-8 text-[#625b51]">{item.body}</p>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-[#d8c7a4] bg-white p-6">
            <h2 className="text-xl font-black text-[#123f39]">قبل إرسال طلب دعم</h2>
            <ul className="mt-3 list-disc space-y-2 pr-6 font-arabic-reading leading-8 text-[#625b51]">
              <li>اكتب وصفًا مختصرًا للمشكلة والخطوات التي أدت إليها.</li>
              <li>اذكر الصفحة أو الميزة المتأثرة، والدولة والصف إذا كانت المشكلة تعليمية.</li>
              <li>لا ترسل كلمة مرور أو مفتاح API أو رقم بطاقة أو رمز تحقق.</li>
              <li>إذا كانت المشكلة في الدفع، يكفي رقم الطلب أو المرجع غير الحساس عند توفره.</li>
            </ul>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white">
              الدخول إلى الحساب
            </Link>
            <Link href="/terms" className="rounded-2xl border border-[#cdbb96] px-6 py-3 font-black text-[#123f39]">
              الشروط والأحكام
            </Link>
            <Link href="/privacy" className="rounded-2xl px-6 py-3 font-black text-[#8b6426]">
              سياسة الخصوصية
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
