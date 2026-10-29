import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";

export const metadata: Metadata = {
  title: "عن ضاديوم ومؤسسها",
  description: "تعرف على ضاديوم Dadyoom، بيت العربية الرقمي، ومؤسسها أ. أحمد سمير محمد حافظ حمام، وكيف يُكتب اسم المنصة بالعربية والإنجليزية.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] px-5 py-12 text-[#27231f] sm:py-20">
      <article className="mx-auto max-w-4xl rounded-3xl border border-[#e2d4b8] bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-[#174f47] hover:underline">العودة إلى ضاديوم</Link>
        <section aria-label="هوية ضاديوم" className="mt-7 rounded-3xl border border-[#ddc99d] bg-[#f9f4e9] p-6 sm:p-8">
          <DadyoomLogo href="" className="items-center" />
          <h1 className="mt-5 text-3xl font-black text-[#174f47] sm:text-4xl">عن ضاديوم | About Dadyoom</h1>
          <p className="mt-3 text-sm font-semibold text-[#75623e]">الاسم المعتمد للمنصة والعلامة: ضاديوم — Dadyoom</p>
        </section>
        <p className="mt-5 text-lg leading-9">ضاديوم (Dadyoom) — بيت العربية الرقمي — مشروع تعليمي يعمل على تقديم تجربة مترابطة لتعلّم اللغة العربية عبر المناهج والمهارات الأربع والتقييم والأنشطة التفاعلية والتقنيات الحديثة.</p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">هوية ضاديوم واسمها الصحيح</h2>
        <p className="mt-3 leading-9">
          «ضاديوم» هو الاسم العربي المعتمد للمنصة وهويتها، ويُكتب بالإنجليزية Dadyoom. لا نعرض اسم أي شركة أخرى بوصفه اسم المشروع أو علامته. وقد يكتبه بعض الزوار
          «ضاضيوم» أو «داديوم» أو «ضاديو»، أو Dadyoum بالأحرف الإنجليزية؛
          جميع هذه الصيغ تشير إلى مشروعنا التعليمي نفسه، وعنوانه الرسمي هو
          {" "}<Link href="/" className="font-semibold text-[#174f47] underline underline-offset-4">dadyoom.com</Link>.
        </p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">الرؤية التعليمية</h2>
        <p className="mt-3 leading-9">أن تكون اللغة العربية أقرب إلى كل متعلم، وأن تجمع التجربة بين أصالة اللغة، والابتكار التربوي، ومراعاة الفروق الفردية، ودور المعلم والأسرة والمدرسة.</p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">المؤسس والإدارة</h2>
        <p className="mt-3 leading-9">أسّس المشروع ويقود تطويره التربوي أ. أحمد سمير محمد حافظ حمام (Mr Ahmed Samir Mohamed Hafez Hamam)، وهو معلم لغة عربية ومتخصص في تطوير التعلم والتقنيات التعليمية، وله خبرة تربوية تزيد على عشرين عامًا.</p>
        <Link href="/founder" className="mt-4 inline-block rounded-xl bg-[#174f47] px-5 py-3 font-bold text-white hover:bg-[#103f39]">تعرّف على مؤسس ضاديوم</Link>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">الشفافية</h2>
        <p className="mt-3 leading-9">تُعرض مكونات المنصة وفق حالة تطويرها الفعلية. المحتوى الذي تنتجه ضاديوم يُميَّز عن المواد والمراجع الرسمية، ولا يعني الاستناد إلى منهج دراسي حصول المنصة على اعتماد من جهة تعليمية.</p>
        <p className="mt-6 text-sm leading-7 text-[#655c51]">هذه صفحة تعريفية بالمشروع ومؤسسه؛ وليست بديلًا عن الإشعارات القانونية أو معلومات تسجيل الكيان التجاري عند وجودها والتحقق منها.</p>
      </article>
    </main>
  );
}
