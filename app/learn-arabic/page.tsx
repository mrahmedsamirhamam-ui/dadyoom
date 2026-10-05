import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "دليل تعلم اللغة العربية",
  description:
    "دليل عملي من ضاديوم لتعلّم القراءة والكتابة والاستماع والتحدث والنحو والمفردات بالعربية بخطة تدريجية قابلة للتطبيق.",
  alternates: { canonical: "/learn-arabic" },
};

const stages = [
  {
    title: "1. ابنِ علاقة ثابتة بين الصوت والحرف",
    body: "في البدايات لا يكفي حفظ شكل الحرف منفردًا. استمع إلى صوته، شاهده في أول الكلمة ووسطها وآخرها، ثم اقرأ كلمات قصيرة تحتويه. التقدم الحقيقي يظهر عندما تستطيع التعرف إلى الحرف داخل كلمة جديدة لا في المثال المحفوظ فقط.",
  },
  {
    title: "2. انتقل من الكلمة إلى الجملة ذات المعنى",
    body: "بعد اتساع حصيلتك من الكلمات، استخدم جملًا قصيرة مرتبطة بمواقف يومية: المدرسة، البيت، الطعام، الوقت، الهوايات. اقرأ الجملة ثم أعد صياغتها بكلماتك، لأن إعادة الصياغة تكشف الفهم أكثر من التكرار.",
  },
  {
    title: "3. اقرأ نصوصًا قصيرة بأسئلة فهم",
    body: "اختر نصًا مناسبًا لمستواك، وحدد فكرته الرئيسة وكلماته الجديدة والعلاقة بين جمله. لا تبدأ بالنصوص الطويلة؛ الأفضل نص قصير تفهمه بعمق ثم تزيد الطول تدريجيًا.",
  },
  {
    title: "4. اكتب قليلًا كل يوم",
    body: "الكتابة مهارة إنتاج، لذلك تحتاج ممارسة منتظمة. ابدأ بجملة صحيحة، ثم فقرة من ثلاث إلى خمس جمل، ثم راجع الإملاء والترابط. احتفظ بالأخطاء المتكررة في قائمة مراجعة خاصة بك بدل تصحيح الخطأ ثم نسيانه.",
  },
  {
    title: "5. اجعل الاستماع والتحدث جزءًا من الخطة",
    body: "استمع إلى مادة تناسب مستواك أكثر من مرة: مرة للفكرة العامة، ومرة لالتقاط الكلمات، ومرة للتقليد والنطق. في التحدث ركز أولًا على الوضوح والاستمرار، ثم حسّن الدقة النحوية تدريجيًا.",
  },
];

const habits = [
  "20–30 دقيقة يوميًا أفضل من جلسة طويلة متباعدة.",
  "راجع الكلمات في جمل، لا في قوائم منفصلة فقط.",
  "اجمع بين القراءة والكتابة والاستماع والتحدث في الأسبوع نفسه.",
  "اختبر نفسك قبل أن تعيد قراءة الشرح؛ الاسترجاع يقيس ما بقي في الذاكرة.",
  "قسّم الأخطاء إلى: مفردات، إملاء، نحو، فهم، ونطق لتعرف أين تركز.",
  "استخدم المنهج المدرسي كمسار، ثم أضف تدريبًا أصليًا على المهارات التي تحتاجها.",
];

export default function LearnArabicPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="font-black text-[#123f39]">ضاديوم</Link>
          <nav className="flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/courses" className="text-[#174f47] hover:underline">المناهج</Link>
            <Link href="/about" className="text-[#174f47] hover:underline">عن ضاديوم</Link>
            <Link href="/contact" className="text-[#174f47] hover:underline">تواصل معنا</Link>
          </nav>
        </div>

        <article className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm sm:p-10">
          <p className="text-sm font-black text-[#a7772f]">دليل ضاديوم العملي</p>
          <h1 className="mt-2 font-arabic-display text-4xl font-black leading-[1.4] text-[#123f39] sm:text-5xl">
            كيف تتعلم اللغة العربية بخطة متوازنة؟
          </h1>
          <p className="mt-5 font-arabic-reading text-lg leading-9 text-[#625b51]">
            لا توجد مهارة واحدة تختصر تعلّم العربية. القراءة تحتاج مفردات وفهمًا،
            والكتابة تحتاج أفكارًا وصياغة وإملاء، والاستماع يهيئ الأذن، والتحدث يحول
            المعرفة إلى استخدام. لذلك تنجح الخطة عندما تربط هذه المهارات معًا وتحدد
            مستوى البداية وتراجع التقدم بصورة منتظمة.
          </p>

          <section className="mt-10">
            <h2 className="text-2xl font-black text-[#123f39]">المسار التدريجي</h2>
            <div className="mt-5 space-y-4">
              {stages.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#e1d4ba] bg-[#f8f1e5] p-5">
                  <h3 className="text-xl font-black text-[#123f39]">{item.title}</h3>
                  <p className="mt-3 font-arabic-reading leading-8 text-[#625b51]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#d8c7a4] bg-white p-6">
              <h2 className="text-2xl font-black text-[#123f39]">النحو: افهم الوظيفة قبل المصطلح</h2>
              <p className="mt-3 font-arabic-reading leading-9 text-[#5f5a51]">
                النحو يصبح أسهل عندما ترى أثره في المعنى. قبل حفظ اسم القاعدة، لاحظ
                كيف تتغير الجملة إذا تغير الفاعل أو الزمن أو الموقع الإعرابي. خذ مثالًا
                واضحًا، استخرج النمط، ثم كوّن مثالًا جديدًا بنفسك. بعد ذلك يأتي المصطلح
                ليعطي اسمًا لما فهمته، لا ليكون بديلًا عن الفهم.
              </p>
            </div>
            <div className="rounded-2xl border border-[#d8c7a4] bg-white p-6">
              <h2 className="text-2xl font-black text-[#123f39]">المفردات: السياق أقوى من الحفظ المجرد</h2>
              <p className="mt-3 font-arabic-reading leading-9 text-[#5f5a51]">
                تعلّم الكلمة مع جملة وصورة ذهنية وموقف استخدام. راجعها بعد يوم ثم بعد
                عدة أيام، وحاول استخدامها في كتابة أو حديث. معرفة معنى الكلمة عند
                رؤيتها مستوى أول؛ القدرة على استدعائها واستخدامها في الوقت المناسب
                هي المستوى الأهم.
              </p>
            </div>
          </section>

          <section className="mt-10 rounded-2xl bg-[#123f39] p-6 text-white sm:p-8">
            <h2 className="text-2xl font-black">عادات صغيرة تصنع فرقًا كبيرًا</h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {habits.map((item) => (
                <li key={item} className="rounded-xl bg-white/10 p-4 font-arabic-reading leading-8 text-[#e4efec]">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-black text-[#123f39]">خطة أسبوعية بسيطة</h2>
            <p className="mt-3 font-arabic-reading leading-9 text-[#5f5a51]">
              خصص يومين للقراءة والمفردات، ويومًا للكتابة والمراجعة الإملائية، ويومين
              للاستماع والتحدث، ويومًا لمراجعة النحو في سياق أمثلة حقيقية. في نهاية
              الأسبوع اختبر نفسك بنص قصير وأسئلة فهم وكتابة فقرة أو تسجيل إجابة صوتية.
              إذا كانت لديك دراسة مدرسية، اربط هذه الأنشطة بوحدة المنهج الحالية حتى لا
              يصبح التدريب منفصلًا عن أهدافك الأساسية.
            </p>
          </section>

          <section className="mt-10 rounded-2xl border border-[#d8c7a4] bg-[#fff7e5] p-6">
            <h2 className="text-xl font-black text-[#123f39]">كيف يستخدم ضاديوم هذه الفكرة؟</h2>
            <p className="mt-3 font-arabic-reading leading-8 text-[#625b51]">
              بوابة المناهج تحدد موقعك التعليمي، ودروس ضاديوم الداعمة تغطي مهارات
              القراءة والكتابة والاستماع والتحدث، بينما يساعد التقييم والتقدم على معرفة
              ما أتقنته وما يحتاج مراجعة. أدوات الذكاء الاصطناعي مساعدة داخل هذا السياق
              وليست بديلًا عن المنهج أو المعلم.
            </p>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="rounded-2xl bg-[#123f39] px-6 py-3 font-black text-white">
              استكشف المناهج
            </Link>
            <Link href="/signup" className="rounded-2xl border border-[#cdbb96] px-6 py-3 font-black text-[#123f39]">
              ابدأ مجانًا
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
