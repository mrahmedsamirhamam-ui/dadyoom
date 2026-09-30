import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لمنصة ضاديوم التعليمية.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "ما البيانات التي نجمعها؟",
    body: "قد نجمع بيانات الحساب التي يقدّمها المستخدم، وبيانات الدور والصف والدولة، وسجل التعلّم والتقدم والأنشطة، وبيانات تقنية ضرورية للأمان وتشغيل الخدمة. عند استخدام أدوات الذكاء الاصطناعي قد تتم معالجة السؤال أو المحتوى اللازم لتقديم الإجابة بواسطة مزودي الخدمة المتعاقد معهم.",
  },
  {
    title: "كيف نستخدم البيانات؟",
    body: "نستخدم البيانات لتشغيل ضاديوم، وتخصيص تجربة التعلّم، وحفظ التقدم، وتحسين الجودة والأمان، وتقديم الدعم، وإدارة الاشتراكات والامتثال للمتطلبات القانونية. لا نبيع البيانات الشخصية للمعلنين.",
  },
  {
    title: "المدفوعات",
    body: "تتم مدفوعات ضاديوم Plus من خلال Paddle. لا تستقبل ضاديوم بيانات البطاقة الكاملة ولا تخزنها. قد تعالج Paddle بيانات الدفع والفوترة وفق سياساتها وشروطها بصفتها مزود الدفع وMerchant of Record.",
  },
  {
    title: "الأطفال والطلاب",
    body: "ضاديوم منصة تعليمية قد يستخدمها طلاب صغار السن. عند الحاجة، يعتمد إنشاء الحساب أو استخدامه على موافقة ولي الأمر أو الجهة التعليمية وفق ما يقتضيه القانون وسياسة المؤسسة التعليمية. نهدف إلى تقليل البيانات المطلوبة إلى الحد اللازم لتقديم الخدمة التعليمية.",
  },
  {
    title: "مشاركة البيانات",
    body: "قد نشارك الحد الأدنى اللازم من البيانات مع مزودي الاستضافة وقواعد البيانات والذكاء الاصطناعي والدفع والتحليلات والأمان عندما يكون ذلك ضروريًا لتقديم الخدمة. كما قد نفصح عن بيانات إذا كان ذلك مطلوبًا بموجب القانون.",
  },
  {
    title: "الاحتفاظ والأمان",
    body: "نحتفظ بالبيانات للمدة اللازمة لتقديم الخدمة والوفاء بالالتزامات القانونية والتشغيلية. نستخدم ضوابط وصول وتقنيات أمان مناسبة، مع العلم أنه لا توجد وسيلة إلكترونية يمكن ضمان أمانها بنسبة 100٪.",
  },
  {
    title: "حقوقك",
    body: "يمكنك طلب تصحيح بياناتك أو الوصول إليها أو حذفها أو إغلاق الحساب حيث يسمح القانون بذلك. بعض السجلات المالية أو الأمنية قد يلزم الاحتفاظ بها لفترة محددة بموجب القانون أو متطلبات مكافحة الاحتيال.",
  },
  {
    title: "التغييرات والتواصل",
    body: "قد نحدّث هذه السياسة عند تطوير الخدمة أو تغير المتطلبات القانونية. ننشر النسخة المحدثة هنا مع تاريخ آخر تحديث. يمكن التواصل معنا من خلال قنوات الدعم المتاحة داخل ضاديوم، وبالنسبة لطلبات الدفع يمكن كذلك استخدام قنوات دعم Paddle.",
  },
];

export default function PrivacyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-black text-[#123f39]">ضاديوم</Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/terms" className="text-[#174f47] hover:underline">الشروط والأحكام</Link>
            <Link href="/refund-policy" className="text-[#174f47] hover:underline">سياسة الاسترداد</Link>
          </nav>
        </div>

        <article className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#a7772f]">QAMORYX Technologies W.L.L</p>
          <h1 className="mt-2 font-arabic-display text-4xl font-black text-[#123f39]">سياسة الخصوصية</h1>
          <p className="mt-4 leading-8 text-[#625b51]">
            توضح هذه السياسة كيف تتعامل منصة ضاديوم (Dadyoom) مع البيانات عند استخدام الموقع والخدمات التعليمية.
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
        </article>
      </div>
    </main>
  );
}
