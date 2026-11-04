import Link from "next/link";

import TeacherFeedbackPanel from "@/features/teacher-feedback/components/TeacherFeedbackPanel";

export const metadata = {
  title: "ملاحظات تربوية موثقة للمعلم | ضاديوم",
  description: "مورد تربوي مجاني من ضاديوم لتحويل دليل الأداء إلى ملاحظة وخطوة علاجية ومعيار قياس، دون حفظ بيانات الطلاب.",
};

export default function PublicTeacherFeedbackResource() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8f7f0] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="العودة إلى الموقع" className="mb-5">
          <Link href="/" className="text-sm font-bold text-emerald-900 hover:underline">
            ضاديوم — الصفحة الرئيسة
          </Link>
        </nav>
        <TeacherFeedbackPanel context="public" />
        <p className="mt-6 text-sm leading-8 text-slate-700">
          هذه صفحة موارد مفتوحة لا تتطلب حسابًا. يمكن للمعلم نسخ الخطة إلى ملفاته الخاصة
          بعد مراجعتها، والاستفادة منها في أي مدرسة. لا تتصل هذه الصفحة بسجلات الطلبة.
        </p>
      </div>
    </main>
  );
}
