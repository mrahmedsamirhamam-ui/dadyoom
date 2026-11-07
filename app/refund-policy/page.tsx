import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الاسترداد ومعلومات الدفع",
  description: "معلومات حالة الاشتراكات والاسترداد في ضاديوم.",
};

export default function RefundPolicyPage() {
  const billingEnabled = process.env.DADYOOM_LIVE_BILLING_ENABLED === "true";
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] px-4 py-12 text-[#173f35]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#dfd2b9] bg-white p-6 sm:p-10">
        <h1 className="text-3xl font-black">سياسة الاسترداد ومعلومات الدفع</h1>
        {billingEnabled ? (
          <p className="mt-5 leading-8">قد تتوفر خدمات مدفوعة. راجع شروط الدفع والاسترداد التي يعرضها مزود الدفع قبل إتمام أي عملية شراء. لا تتضمن هذه الصفحة وعدًا بمدة استرداد غير موثقة.</p>
        ) : (
          <p className="mt-5 leading-8">الشراء المباشر لخطة Plus غير مفعّل حاليًا في ضاديوم؛ لا يمكنك بدء عملية شراء جديدة من صفحة الأسعار في هذه المرحلة.</p>
        )}
        <p className="mt-4 leading-8">إذا كانت لديك عملية دفع سابقة وتريد الاستفسار عن استردادها، فاحتفظ بإثبات الدفع وتواصل عبر قناة الدعم الرسمية الظاهرة في الموقع. لا ترسل بيانات بطاقتك أو كلمات مرورك.</p>
        <p className="mt-4 text-sm text-[#665d51]">هذه صفحة معلومات أولية وليست سياسة تعاقدية مفصلة. يجب اعتماد شروط الاسترداد الفعلية قبل تفعيل الشراء.</p>
        <Link href="/pricing" className="mt-7 inline-block rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white">العودة إلى الخطط</Link>
      </div>
    </main>
  );
}
