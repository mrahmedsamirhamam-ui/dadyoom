import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "عن ضاديوم | بيت العربية الرقمي",
 description: "تعرف إلى رسالة ضاديوم ومؤسسها ونهج بناء محتوى عربي أصيل من دون ادعاء اعتماد وزاري غير مثبت.",
 alternates: { canonical: "/about" },
};
export default function AboutDadyoom() {
 return (
  <main dir="rtl" className="mx-auto max-w-4xl px-4 py-12 text-[#123f39]">
   <header className="rounded-3xl bg-emerald-950 p-8 text-white">
    <p className="font-bold text-amber-200">ضاديوم — بيت العربية الرقمي</p>
    <h1 className="mt-3 text-3xl font-extrabold">عن ضاديوم</h1>
    <p className="mt-4 leading-9 text-emerald-50">
     مشروع تربوي رقمي لتيسير تعلم العربية وإثراء مهارات القراءة والكتابة والاستماع والتحدث،
     مع احترام تنوع المتعلمين ومراحل نموهم، والاستفادة المسؤولة من التقنيات الحديثة.
    </p>
   </header>
   <section className="mt-8 space-y-5 leading-9 text-slate-800">
    <h2 className="text-xl font-extrabold">المؤسس</h2>
    <p>مؤسس ضاديوم وصاحب رؤيتها التعليمية: <strong>أ. أحمد سمير محمد حافظ حمام</strong> (Mr Ahmed Samir Mohamed Hafez Hamam)، معلّم لغة عربية ومطوّر محتوى تربوي. لا تعرض هذه الصفحة أسماء شركاء أو مؤسسات لم تثبت علاقتهم بالمشروع.</p>
    <h2 className="text-xl font-extrabold">ما تقدمه المنصة</h2>
    <p>دليلًا للدول والصفوف، ودروسًا وتدريبات ومهارات، ورفيقًا تعليميًا باسم «ضاد». الوصول الأساسي إلى الدروس مجاني، بينما تظل مزايا Plus الاختيارية والدفع والمواءمة الوزارية الشاملة خاضعة لتفعيل واختبار مستقلين.</p>
    <h2 className="text-xl font-extrabold">النزاهة والمراجعة</h2>
    <p>تسعى ضاديوم إلى تقديم شروح وأنشطة أصلية قابلة للمراجعة والتصحيح. لا يعني وجود اسم دولة أو صف أن كل درس يطابق حاليًا الفهرس الرسمي لوزارة تعليمها، ولا تدّعي المنصة اعتمادًا مؤسسيًا أو نتائج استخدام غير موثقة.</p>
    <h2 className="text-xl font-extrabold">التعلّم بكرامة وأمان</h2>
    <p>تضع المنصة خصوصية الطفل وسلامة تقويمه في مقدمة التطوير، وتفضل التغذية الراجعة المشجعة والتدرج بحسب الفروق الفردية. المقصود من الذكاء الاصطناعي دعم المعلم والمتعلم لا استبدال الحكم التربوي البشري.</p>
   </section>
   <nav aria-label="استكشف ضاديوم" className="mt-8 flex flex-wrap gap-5 font-bold">
    <Link href="/courses" className="underline underline-offset-4">المناهج والدروس</Link>
    <Link href="/guides" className="underline underline-offset-4">أدلة التعلّم</Link>
    <Link href="/faq" className="underline underline-offset-4">الأسئلة الشائعة</Link>
   </nav>
  </main>
 );
}
