import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "سياسة الاسترداد",
  description: "سياسة إلغاء الاشتراك والاسترداد في ضاديوم Plus.",
  alternates: { canonical: "/refund-policy" },
};

const sections = [
  {
    title: "إلغاء الاشتراك",
    body: "يمكن إلغاء ضاديوم Plus من أدوات إدارة الاشتراك المتاحة للمستخدم. يمنع الإلغاء التجديدات المستقبلية، ويستمر الوصول المدفوع عادة حتى نهاية الفترة التي تم دفعها بالفعل.",
  },
  {
    title: "طلبات الاسترداد",
    body: "يمكن طلب استرداد كامل أو جزئي عند وجود سبب مشروع مثل تحصيل مكرر أو خطأ في الفوترة أو حالة يوجب فيها قانون حماية المستهلك الاسترداد. تتم مراجعة الأهلية وفق تفاصيل المعاملة والقانون الواجب التطبيق وشروط Paddle.",
  },
  {
    title: "طريقة الاسترداد",
    body: "تتم المدفوعات عبر Paddle بصفتها Merchant of Record. عند اعتماد الاسترداد يعاد المبلغ إلى وسيلة الدفع الأصلية وفق إجراءات Paddle والبنك أو مزود الدفع. قد تختلف مدة ظهور المبلغ بحسب وسيلة الدفع.",
  },
  {
    title: "عدم الاسترداد التلقائي عند الإلغاء",
    body: "إلغاء التجديد لا يعني تلقائيًا رد المبلغ المدفوع عن الفترة الحالية. تبقى الحقوق الإلزامية للمستهلك محفوظة، وأي استرداد معتمد يعالج وفق القواعد المطبقة على المعاملة.",
  },
  {
    title: "المدفوعات غير المصرح بها أو المشكلات",
    body: "إذا لاحظت عملية غير معروفة أو مشكلة في الدفع، تواصل فورًا عبر قنوات الدعم داخل ضاديوم أو دعم Paddle مع بيانات الطلب غير الحساسة اللازمة للتحقق. لا ترسل بيانات البطاقة الكاملة عبر الرسائل أو نماذج الدعم.",
  },
  {
    title: "التغييرات",
    body: "قد نحدّث هذه السياسة عند تغير المنتج أو مزود الدفع أو المتطلبات القانونية. تسري النسخة المنشورة هنا مع الحفاظ على الحقوق التي لا يجوز قانونًا الانتقاص منها.",
  },
];

export default function RefundPolicyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-black text-[#123f39]">ضاديوم</Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/terms" className="text-[#174f47] hover:underline">الشروط والأحكام</Link>
            <Link href="/privacy" className="text-[#174f47] hover:underline">سياسة الخصوصية</Link>
          </nav>
        </div>

        <article className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#a7772f]">QAMORYX Technologies W.L.L</p>
          <h1 className="mt-2 font-arabic-display text-4xl font-black text-[#123f39]">سياسة الاسترداد</h1>
          <p className="mt-4 leading-8 text-[#625b51]">
            توضح هذه السياسة آلية إلغاء ضاديوم Plus وطلبات الاسترداد للمدفوعات التي تتم عبر Paddle.
          </p>
          <p className="mt-2 text-sm font-bold text-[#7b7165]">آخر تحديث: 30 سبتمبر 2026</p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black text-[#123f39]">{section.title}</h2>
                <p className="mt-2 font-arabic-reading leading-8 text-[#5f5a51]">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[#d8c7a4] bg-[#f8f1e5] p-5">
            <p className="font-black text-[#123f39]">ملاحظة الدفع</p>
            <p className="mt-2 leading-8 text-[#625b51]">
              ضاديوم لا يستقبل أو يخزن بيانات البطاقة الكاملة. تتم الفوترة والاستردادات المالية من خلال Paddle.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
