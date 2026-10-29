import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";
export const metadata: Metadata = {
 title: "الأسئلة الشائعة عن ضاديوم",
 description: "إجابات واضحة عن مجانية ضاديوم وPlus والمناهج الرسمية والصوت وخصوصية الأطفال.",
 alternates: { canonical: "/faq" },
};
const answers = [
  {
    "question": "هل الدراسة في ضاديوم مجانية؟",
    "answer": "نعم، يتيح ضاديوم الوصول الأساسي إلى الدروس والتدريبات دون اشتراك إلزامي. قد تُفرض حدود يومية على بعض أدوات توليد المحتوى بالذكاء الاصطناعي. لن يتحول الحساب المجاني تلقائيًا إلى خطة مدفوعة."
  },
  {
    "question": "هل Plus متاح للاشتراك الآن؟",
    "answer": "تظهر خطة Plus ومزاياها بصورة تعريفية، لكن تحصيل الدفع لا يبدأ إلا بعد تفعيل البوابة وإعداداتها ونشر الشروط ذات الصلة. لا تعني بطاقة التسعير وجود بوابة دفع حية."
  },
  {
    "question": "هل جميع الدروس مطابقة للكتب الوزارية؟",
    "answer": "ليس بالضرورة. توجد مسارات للدول والصفوف، وما لم يثبت ربطه بفهرس رسمي مُحدَّث يجب التعامل معه باعتباره إثراءً مهاريًا عامًا. يرجى مراجعة الكتاب المعتمد في المدرسة."
  },
  {
    "question": "كيف أبدأ دون إنشاء حساب؟",
    "answer": "يمكنك تصفح مسارات التعلم المتاحة من صفحة المناهج والاطلاع على الدروس المنشورة. يحتاج حفظ التقدم وبعض الخدمات الشخصية إلى حساب مناسب وصلاحيات صحيحة."
  },
  {
    "question": "هل يدعم ضاديوم الناطقين بغير العربية؟",
    "answer": "توجد مسارات للمبتدئين وأنشطة تتدرج من الحرف والصوت إلى الكلمة والجملة. يختلف نطاق المحتوى المتاح بحسب المرحلة، ولا يثبت مجرد وجود المسار اكتمال جميع مستوياته."
  },
  {
    "question": "هل كل درس يتضمن تسجيلًا صوتيًا؟",
    "answer": "لا يصح افتراض ذلك. تستخدم بعض الصفحات النطق العربي المتاح في المتصفح عند دعمه، وتحتاج بعض أنشطة الاستماع إلى قراءة المعلم أو ولي الأمر. توجد حاجة إلى مراجعة الصوت درسًا بدرس."
  },
  {
    "question": "هل يمكن للمعلم وولي الأمر متابعة تقدم الطفل؟",
    "answer": "تتضمن المنصة مساحات وأدوات تقدم مرتبطة بالأدوار، لكن الوصول إلى بيانات الطفل ينبغي أن يكون وفق علاقة ربط وصلاحيات معتمدة. لا تُعرض النتائج الفردية للعموم."
  },
  {
    "question": "كيف أستخدم ضاد بصورة آمنة؟",
    "answer": "استخدم ضاد للاستفسار عن كلمة أو قاعدة أو درس مناسب للعمر، ولا تشاركه بيانات شخصية أو كلمات مرور. ينبغي أن تكون إجاباته التعليمية قابلة للمراجعة، وألا تحل محل إشراف المعلم."
  },
  {
    "question": "كيف تعمل الإعلانات للمستخدم المجاني؟",
    "answer": "تُعد الإعلانات ميزة قابلة للتفعيل وفق إعدادات المنصة والموافقة المطلوبة، ولا ينبغي تحميلها داخل نص الدرس أو أثناء الإجابة أو لدى مستخدم Plus. لا يعني وجود صفحة إعلانات أن الإعلانات تعمل حاليًا."
  },
  {
    "question": "كيف أتواصل عند وجود خطأ في محتوى؟",
    "answer": "يمكنك إبلاغ فريق المنصة من صفحة التواصل أو صندوق المقترحات. عند الإبلاغ، اذكر اسم الدرس والصف والدولة ووصف الخطأ دون إرسال بيانات طفل أو إجابات خاصة لا حاجة لها."
  }
] as const;
export default function FAQPage() {
 const jsonLd={
  "@context":"https://schema.org",
  "@type":"FAQPage",
  "@id":`${getSiteUrl()}/faq#faq`,
  mainEntity:answers.map(item=>({
   "@type":"Question",name:item.question,
   acceptedAnswer:{"@type":"Answer",text:item.answer},
  })),
 };
 return <main dir="rtl" className="mx-auto max-w-4xl px-4 py-12 text-[#123f39]">
   <h1 className="text-3xl font-extrabold">الأسئلة الشائعة</h1>
   <p className="mt-4 leading-8 text-slate-700">نوضح ما هو متاح فعلًا، وما لا يزال قيد التحقق أو التفعيل، دون ادعاء اعتماد أو شراكات أو نتائج مستخدمين.</p>
   <div className="mt-8 space-y-4">
    {answers.map(item=><details key={item.question} className="rounded-2xl border border-emerald-100 bg-white p-5">
      <summary className="cursor-pointer font-bold leading-8">{item.question}</summary>
      <p className="mt-3 leading-8 text-slate-700">{item.answer}</p>
     </details>)}
   </div>
   <div className="mt-9 flex flex-wrap gap-5">
    <Link className="font-bold underline" href="/guides">الأدلة التعليمية</Link>
    <Link className="font-bold underline" href="/courses">تصفح الدروس</Link>
    <Link className="font-bold underline" href="/pricing">الخطة المجانية وPlus</Link>
   </div>
   <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,"\\u003c")}}/>
 </main>;
}
