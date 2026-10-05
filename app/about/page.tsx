import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "عن ضاديوم",
  description:
    "تعرف على ضاديوم، رسالتها التعليمية، منهجها في ربط المناهج بمهارات اللغة العربية، وكيف تحافظ على المحتوى الأصلي والمصادر الرسمية.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "المنهج نقطة البداية",
    body: "يبدأ ضاديوم من الدولة والصف والمنهج أو الكتاب الرسمي المتاح، ثم يربط ذلك بشرح وتدريب أصليين يساعدان الطالب على الفهم والممارسة. لا ندّعي أن محتوى ضاديوم نسخة من الكتاب المدرسي، ولا نختلق عناوين رسمية لا يمكن التحقق منها.",
  },
  {
    title: "التعلّم أكبر من حفظ الإجابة",
    body: "تصمم الدروس حول القراءة والفهم والتحليل والتطبيق والكتابة والاستماع والتحدث. الهدف أن يفهم الطالب لماذا كانت الإجابة صحيحة، وأن يستطيع استخدام المهارة في موقف جديد.",
  },
  {
    title: "الذكاء الاصطناعي داخل سياق تعليمي",
    body: "يعمل ضاد وأدوات الذكاء الاصطناعي داخل سياق الصف والدرس والمهارة بدل أن تكون نافذة دردشة منفصلة. وقد تخطئ أدوات الذكاء الاصطناعي، لذلك تبقى المراجعة البشرية مهمة في القرارات التعليمية الحساسة.",
  },
  {
    title: "المصدر الرسمي له الأولوية",
    body: "عند مطابقة المناهج نفضّل مصادر وزارات التربية والمؤسسات الحكومية والناشرين الرسميين. إذا كان المصدر يثبت وجود كتاب أو بنية عامة فقط، نحافظ على المطابقة عند هذا المستوى بدل تحويل التخمين إلى حقيقة.",
  },
];

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-black text-[#123f39]">ضاديوم</Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/learn-arabic" className="text-[#174f47] hover:underline">دليل تعلم العربية</Link>
            <Link href="/courses" className="text-[#174f47] hover:underline">المناهج</Link>
            <Link href="/contact" className="text-[#174f47] hover:underline">تواصل معنا</Link>
          </nav>
        </div>

        <article className="overflow-hidden rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] shadow-sm">
          <div className="bg-[#123f39] p-7 text-white sm:p-10">
            <p className="text-sm font-black text-[#efcb79]">QAMORYX Technologies W.L.L</p>
            <h1 className="mt-3 font-arabic-display text-4xl font-black sm:text-5xl">عن ضاديوم</h1>
            <p className="mt-5 max-w-3xl font-arabic-reading text-lg leading-9 text-[#dce8e4]">
              ضاديوم منصة تعليمية عربية تجمع المنهج والمهارات الأربع والتقييم والتقدم
              وأدوات الذكاء الاصطناعي في رحلة واحدة. رسالتنا أن تكون العربية أقرب إلى
              قلب الطالب وعقله، وأن يعرف المتعلم دائمًا ماذا يتعلم ولماذا وما الخطوة التالية.
            </p>
          </div>

          <div className="space-y-10 p-6 sm:p-10">
            <section>
              <h2 className="text-2xl font-black text-[#123f39]">ما المشكلة التي نحاول حلها؟</h2>
              <div className="mt-4 space-y-4 font-arabic-reading leading-9 text-[#5f5a51]">
                <p>
                  يتنقل كثير من الطلاب بين كتاب المدرسة وملفات متفرقة وفيديوهات وأدوات
                  ذكاء اصطناعي لا تعرف صف الطالب ولا درسه. النتيجة قد تكون وفرة في الأدوات
                  مع ضعف في المسار. ضاديوم يعيد ترتيب هذه التجربة: الدولة ثم الصف ثم المنهج
                  أو الكتاب، ثم درس وتدريب وتقدم واضح.
                </p>
                <p>
                  نغطي الدول العربية ضمن طبقة أساسية موحدة للمهارات، مع طبقات وطنية
                  مرتبطة بالمصادر الرسمية بقدر ما تسمح به المصادر العامة القابلة للتحقق.
                  عندما تتوفر عناوين رسمية تفصيلية نستخدمها كبنية مرجعية، بينما يبقى الشرح
                  والأسئلة والأنشطة التي ينشئها ضاديوم محتوى أصليًا.
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {principles.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#e1d4ba] bg-[#f8f1e5] p-5">
                  <h2 className="text-xl font-black text-[#123f39]">{item.title}</h2>
                  <p className="mt-3 font-arabic-reading leading-8 text-[#625b51]">{item.body}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-2xl font-black text-[#123f39]">لمن صُمم ضاديوم؟</h2>
              <p className="mt-3 font-arabic-reading leading-9 text-[#5f5a51]">
                للطلاب الذين يريدون مسارًا واضحًا، وللمعلمين الذين يحتاجون أدوات تعليم
                ومتابعة قابلة للاستخدام، ولأولياء الأمور الذين يريدون فهم تقدم أبنائهم،
                وللمدارس التي تحتاج بيئة موحدة تربط التعلم بالحضور والأنشطة والمتابعة.
                توجد أيضًا مساحات للمبتدئين والناطقين بغير العربية، لأن اكتساب اللغة
                يحتاج مسارًا تدريجيًا يختلف عن مراجعة منهج مدرسي قائم.
              </p>
            </section>

            <section className="rounded-2xl border border-[#d8c7a4] bg-white p-6">
              <h2 className="text-2xl font-black text-[#123f39]">الشفافية وحقوق المحتوى</h2>
              <p className="mt-3 font-arabic-reading leading-9 text-[#5f5a51]">
                نميّز بين المصدر الرسمي وبين محتوى ضاديوم الأصلي. لا نعيد نشر الكتب
                المحمية كاملة، ولا نعتبر مجرد وجود عنوان على الإنترنت دليلًا رسميًا.
                إذا تعذر التحقق من عنوان أو فهرس نصرّح بذلك ونبقي المطابقة عند مستوى
                الكتاب أو المهارة. هذا المبدأ جزء من جودة المنصة ومن احترام حقوق أصحاب
                المحتوى في الوقت نفسه.
              </p>
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href="/courses" className="rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white">
                استكشف المناهج
              </Link>
              <Link href="/learn-arabic" className="rounded-2xl border border-[#cdbb96] px-6 py-3 font-black text-[#123f39]">
                اقرأ دليل تعلم العربية
              </Link>
              <Link href="/contact" className="rounded-2xl px-6 py-3 font-black text-[#8b6426]">
                تواصل معنا
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
