import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";

export const metadata: Metadata = {
  title: "عن ضاديوم | رسالتنا ومناهجنا ومؤسسنا",
  description:
    "تعرّف على ضاديوم Dadyoom، بيت العربية الرقمي: لماذا تأسست المنصة، وكيف تربط المناهج بالمهارات الأربع والتعلّم الذكي، ومن هو مؤسسها.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "عن ضاديوم | Dadyoom — بيت العربية الرقمي",
    description:
      "تعليم العربية من المنهج إلى التدريب والتقدّم، مع الحفاظ على المصادر الموثوقة والمحتوى الأصلي.",
    url: "/about",
    type: "website",
  },
};

const learningSkills = [
  {
    number: "01",
    title: "القراءة",
    description: "قراءة النصوص وفهم المفردات والأفكار والعلاقات والمعاني.",
  },
  {
    number: "02",
    title: "الكتابة",
    description: "بناء الجملة والإملاء والتعبير والمراجعة والتحسين.",
  },
  {
    number: "03",
    title: "الاستماع",
    description: "تدريب الفهم المسموع والانتباه للأصوات والمعنى.",
  },
  {
    number: "04",
    title: "التحدث",
    description: "التدرّج في النطق والتعبير الشفهي والتواصل.",
  },
] as const;

const pathways = [
  {
    number: "١",
    title: "ابدأ من منهجك",
    description:
      "حدّد الدولة ثم الصف والمنهج أو الكتاب والفصل والوحدة والدرس بحسب ما هو متاح وموثّق.",
  },
  {
    number: "٢",
    title: "تعلّم بوضوح",
    description:
      "شاهد الشرح وأمثلة الفهم، ثم انتقل إلى أنشطة متدرّجة تراعي اختلاف مستويات الطلاب.",
  },
  {
    number: "٣",
    title: "جرّب وقيّم",
    description:
      "تدرّب على مهارات العربية، وراجع تفسير الإجابة، واعرف ما يحتاج إلى تحسين.",
  },
  {
    number: "٤",
    title: "اعرف خطوتك التالية",
    description:
      "استخدم مؤشرات التقدّم المتاحة، واطلب دعم ضاد أو المعلم أو الأسرة عندما يلزم.",
  },
] as const;

const audiences = [
  ["الطالب", "رحلة تعلّم منظمة تتصل بالصف والدرس بدل التنقل بين مصادر متفرّقة."],
  ["المعلم", "موارد درس وأسئلة وأنشطة وتقويمات وأدوات تخطيط ومتابعة قابلة للمراجعة."],
  ["ولي الأمر", "صورة أوضح عن مهارات الأبناء واحتياجات المساندة والتقدم الدراسي."],
  ["المدرسة", "مساحة تجمع المحتوى والفصول والأدوار والتقارير في منظومة واحدة."],
] as const;

const qualityPrinciples = [
  {
    title: "المصدر الرسمي أولًا",
    body:
      "نفضّل ما تنشره وزارات التربية والمؤسسات الحكومية والناشرون الرسميون عند التحقق من الكتب والفهارس والخطط.",
  },
  {
    title: "حدود المطابقة واضحة",
    body:
      "عندما يثبت المصدر وجود كتاب أو مجال تعلّم فقط، نذكر ذلك بصراحة، ولا ننسب إليه عناوين دروس أو تفاصيل لم نتحقق منها.",
  },
  {
    title: "شرح وأنشطة من إنتاجنا",
    body:
      "يقدّم ضاديوم صياغات تعليمية وتطبيقات وأسئلة أصلية، ولا يعيد نشر الكتب المحمية أو يدّعي اعتمادًا وزاريًا غير موثّق.",
  },
] as const;

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden bg-[#faf6ed] text-[#203c35]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-7 sm:pt-10 lg:px-10">
        <nav aria-label="مسار الصفحة" className="mb-6 flex flex-wrap items-center gap-3 text-sm font-bold text-[#32635a]">
          <Link href="/" className="rounded-lg px-2 py-1 transition hover:bg-white hover:underline">
            الرئيسية
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="text-[#5f5a4c]">عن ضاديوم</span>
        </nav>

        <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#123e37] px-6 py-9 text-white shadow-[0_18px_40px_-25px_rgba(16,62,55,.55)] sm:px-12 sm:py-14 lg:px-16">
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full border border-[#d8b975]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-24 h-72 w-72 rounded-full bg-[#246a58]/35 blur-3xl" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex rounded-2xl border border-white/20 bg-white/95 px-4 py-3">
              <DadyoomLogo href="" />
            </div>
            <p className="mt-9 inline-flex rounded-full border border-[#e6c77b]/40 bg-[#e6c77b]/10 px-4 py-2 text-xs font-extrabold tracking-wide text-[#f8dd9b]">
              ضاديوم — Dadyoom | بيت العربية الرقمي
            </p>
            <h1 className="mt-5 font-arabic-display text-4xl font-black leading-[1.35] tracking-tight sm:text-5xl lg:text-6xl">
              عن ضاديوم
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-9 text-[#f7ebd3] sm:text-xl">
              العربية أقرب إلى قلب الطالب وعقله، من المنهج إلى الفهم والتطبيق والتقدّم.
            </p>
            <p className="mt-5 max-w-3xl text-base leading-9 text-[#e2eee9]">
              ضاديوم منصة تعليمية عربية تسعى إلى جمع المناهج، والمهارات اللغوية الأربع،
              والأنشطة والتقييم، وأدوات الذكاء الاصطناعي داخل تجربة تعلّم واحدة.
              نريد أن يعرف المتعلم ما الذي يتعلّمه، ولماذا يتعلّمه، وما الخطوة التالية في رحلته.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="rounded-xl bg-[#f3d28b] px-6 py-3 text-sm font-black text-[#164239] transition hover:bg-[#ffe4aa]">
                استكشف المناهج
              </Link>
              <Link href="/how-to-use" className="rounded-xl border border-white/45 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                دليل الاستخدام
              </Link>
            </div>
          </div>
        </header>

        <section aria-labelledby="identity-title" className="mt-9 rounded-[1.75rem] border border-[#e8dbbf] bg-white px-6 py-8 shadow-sm sm:px-10">
          <p className="text-xs font-black text-[#9b7834]">هويتنا</p>
          <h2 id="identity-title" className="mt-2 font-arabic-display text-2xl font-black sm:text-3xl">
            اسمنا ضاديوم — Dadyoom
          </h2>
          <p className="mt-4 max-w-5xl text-base leading-9 text-[#4c5a53]">
            الاسم العربي المعتمد للمشروع هو «ضاديوم»، ويُكتب بالإنجليزية «Dadyoom».
            وقد تظهر له كتابات بحث قريبة مثل «ضاضيوم» أو «داديوم» أو «ضاديو»
            أو «Dadyoum»؛ وجميعها تقصد منصتنا التعليمية الموجودة على
            {" "}<Link href="/" className="font-bold text-[#146f5b] underline underline-offset-4">dadyoom.com</Link>.
            «ضاد» هو اسم المساعد الذكي داخل المنصة، وليس اسم شركة مختلفة.
          </p>
          <p className="mt-4 text-sm leading-8 text-[#69645d]">
            «ضاديوم» هو اسم المنصة وعلامتها المستخدمة هنا. لا نعرض اسم كيان تجاري
            أو صيغة قانونية مثل ذ.م.م إلا إذا أمكن إثباتها بوثائق تسجيل معتمدة.
          </p>
        </section>

        <section aria-labelledby="problem-title" className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <p className="text-xs font-black text-[#a47b32]">لماذا ضاديوم؟</p>
            <h2 id="problem-title" className="mt-3 font-arabic-display text-3xl font-black leading-[1.5] sm:text-4xl">
              حلّ مشكلة تشتّت التعلّم
            </h2>
            <p className="mt-5 text-base leading-9 text-[#4a5b53]">
              ينتقل الطلاب أحيانًا بين الكتاب المدرسي وملفات منفصلة وفيديوهات وأدوات
              ذكاء اصطناعي لا تعرف بلد الطالب ولا صفه أو درسه. كثرة الأدوات لا تعني
              دائمًا وضوح التعلّم. لهذا نرتّب الخبرة حول المنهج أولًا، ثم الدرس والتدريب والتقدّم.
            </p>
            <p className="mt-4 text-base leading-9 text-[#4a5b53]">
              نعمل على دليل للدول العربية الـ22، بطبقة مشتركة للمهارات وطبقات وطنية
              مرتبطة بما يمكن التحقق منه من المصادر الرسمية. ولا تعني إتاحة دليل دولة
              أو صف أن كل درس أو مصدر مكتمل أو معتمد رسميًا.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#dac9a9] bg-[#f3ead7] p-6 sm:p-8">
            <p className="text-xs font-black text-[#9b7834]">منظومة تعلّم مترابطة</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {pathways.map((item) => (
                <article key={item.number} className="rounded-2xl border border-[#e9dec9] bg-white p-5">
                  <span aria-hidden="true" className="text-sm font-black text-[#b28a42]">{item.number}</span>
                  <h3 className="mt-2 text-lg font-black text-[#174f47]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#637168]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="learning-title" className="mt-14 rounded-[1.75rem] bg-white px-6 py-10 shadow-sm ring-1 ring-[#e7dbc6] sm:px-10">
          <p className="text-xs font-black text-[#a47b32]">التعلّم أعمق من حفظ الإجابة</p>
          <h2 id="learning-title" className="mt-2 font-arabic-display text-3xl font-black">
            نفهم، نطبّق، ثم نحسّن
          </h2>
          <p className="mt-4 max-w-4xl leading-9 text-[#516158]">
            نصوغ التعلم حول معنى النص وتحليله وتطبيق القاعدة في مواقف جديدة.
            لا يكفي الوصول إلى الاختيار الصحيح؛ الأهم فهم سبب صحته والقدرة على
            استخدام المهارة خارج السؤال نفسه.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningSkills.map((item) => (
              <article key={item.number} className="rounded-2xl border border-[#e8ddc9] bg-[#faf8f2] p-5">
                <span className="text-sm font-black text-[#a67a32]">{item.number}</span>
                <h3 className="mt-3 text-xl font-black text-[#174f47]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#56665d]">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="ai-title" className="mt-14 grid gap-7 lg:grid-cols-2">
          <div className="rounded-[1.75rem] bg-[#174f47] p-7 text-white sm:p-9">
            <p className="text-xs font-black text-[#f3d28b]">ضاد — المساعد التعليمي</p>
            <h2 id="ai-title" className="mt-3 font-arabic-display text-2xl font-black sm:text-3xl">
              ذكاء اصطناعي يفهم سياق الدرس
            </h2>
            <p className="mt-5 leading-9 text-[#e0ede8]">
              نطوّر مساعد «ضاد» وأدوات الذكاء الاصطناعي لتساند المتعلم داخل
              سياق الصف والمهارة، وتساعده على اكتشاف الفكرة خطوة بخطوة بدل الاكتفاء
              بتلقّي الإجابة. قد تخطئ الأدوات الآلية؛ لذلك تبقى مراجعة المعلم
              والتقويم البشري ضرورية للقرارات التعليمية الحساسة.
            </p>
            <Link href="/ask" className="mt-6 inline-flex rounded-xl bg-[#f3d28b] px-5 py-3 text-sm font-black text-[#133e36]">
              تعرّف إلى ضاد
            </Link>
          </div>
          <div className="rounded-[1.75rem] border border-[#e8dbc5] bg-white p-7 sm:p-9">
            <p className="text-xs font-black text-[#a47b32]">المنهج نقطة البداية</p>
            <h2 className="mt-3 font-arabic-display text-2xl font-black sm:text-3xl">
              مطابقة موثّقة لا عناوين مفترضة
            </h2>
            <p className="mt-5 leading-9 text-[#526159]">
              عندما يتوافر فهرس رسمي أو خطة دراسية منشورة نستخدمها مرجعًا لبنية
              المنهج. وإذا كان المصدر يثبت وجود كتاب أو مجال فقط، نعلن حدود
              معرفتنا ولا نختلق أسماء وحدات أو دروس. يبقى الشرح والتدريب
              والتطبيق الذي نصمّمه محتوى تعليميًا أصيلًا مستقلًا عن صفحات الكتب المحمية.
            </p>
            <Link href="/courses" className="mt-6 inline-flex rounded-xl border border-[#1d6b5b] px-5 py-3 text-sm font-black text-[#174f47] transition hover:bg-[#eef5ef]">
              ابدأ من بلدك وصفك
            </Link>
          </div>
        </section>

        <section aria-labelledby="source-title" className="mt-14">
          <p className="text-xs font-black text-[#a47b32]">الثقة والشفافية</p>
          <h2 id="source-title" className="mt-3 font-arabic-display text-3xl font-black">
            ما الذي نعد به المتعلم؟
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {qualityPrinciples.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[#e4d6ba] bg-white p-6">
                <h3 className="text-lg font-black text-[#174f47]">{item.title}</h3>
                <p className="mt-3 leading-8 text-[#55665d]">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-8 text-[#6b695e]">
            لا تعني الاستفادة من مصدر حكومي أو عنوان كتاب وجود شراكة أو اعتماد
            رسمي للمنصة. كما أن بعض الدروس والخدمات تتطور تدريجيًا ويجب
            التحقق من جاهزيتها الفعلية قبل الاعتماد عليها.
          </p>
        </section>

        <section aria-labelledby="people-title" className="mt-14 rounded-[1.75rem] border border-[#e2d3b6] bg-white p-7 sm:p-10">
          <p className="text-xs font-black text-[#a47b32]">من نخدم؟</p>
          <h2 id="people-title" className="mt-3 font-arabic-display text-3xl font-black">
            الطالب والمعلم والأسرة والمدرسة
          </h2>
          <p className="mt-4 max-w-4xl leading-9 text-[#58665f]">
            صُمم ضاديوم للناطقين باللغة العربية ولغير الناطقين بالعربية ممن يبدأون تعلمها من الصفر،
            مع اختلاف المسار والمستوى ووسائل الدعم بحسب حاجة المتعلم.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {audiences.map(([title,description]) => (
              <article key={title} className="rounded-xl border border-[#e7dbc6] bg-[#fcfaf6] p-5">
                <h3 className="text-lg font-black text-[#174f47]">{title}</h3>
                <p className="mt-2 leading-8 text-[#536157]">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="founder-title" className="mt-14 rounded-[1.75rem] border border-[#decba6] bg-[#f5ead4] p-7 sm:p-10">
          <p className="text-xs font-black text-[#9a732f]">المؤسس والرؤية</p>
          <h2 id="founder-title" className="mt-3 font-arabic-display text-3xl font-black">
            أ. أحمد سمير محمد حافظ حمام
          </h2>
          <p lang="en" dir="ltr" className="mt-2 text-right font-bold text-[#526c5c]">
            Mr Ahmed Samir Mohamed Hafez Hamam
          </p>
          <p className="mt-5 max-w-5xl leading-9 text-[#44584e]">
            مؤسس مشروع ضاديوم ومديره، متخصص في تعليم اللغة العربية وتطوير
            التعلم الرقمي، ويتمتع بخبرة تربوية تتجاوز عشرين عامًا.
            تنطلق رؤيته من تيسير العربية بأساليب تربوية أصيلة ومراعاة الفروق
            الفردية، مع تعزيز دور المعلم والأسرة والمدرسة.
          </p>
          <Link href="/founder" className="mt-6 inline-flex rounded-xl bg-[#174f47] px-6 py-3 font-black text-white transition hover:bg-[#0f3c35]">
            السيرة التعريفية بالمؤسس ومؤلفاته
          </Link>
        </section>

        <footer className="mt-14 border-t border-[#dfd1b8] pt-9">
          <h2 className="font-arabic-display text-2xl font-black">
            ابدأ رحلتك مع ضاديوم
          </h2>
          <p className="mt-3 max-w-3xl leading-8 text-[#56635a]">
            اختر المنهج المناسب، أو اقرأ دليل الاستخدام، أو تعرف إلى مؤسس المنصة.
            ضاديوم بيت العربية الرقمي، حيث تبقى جودة التعلم وحقوق المحتوى والشفافية أولويتنا.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/courses" className="rounded-xl bg-[#174f47] px-5 py-3 text-sm font-bold text-white">
              استكشف المناهج
            </Link>
            <Link href="/how-to-use" className="rounded-xl border border-[#bca16e] px-5 py-3 text-sm font-bold text-[#174f47]">
              دليل تعلم العربية
            </Link>
            <Link href="/founder" className="rounded-xl border border-[#bca16e] px-5 py-3 text-sm font-bold text-[#174f47]">
              المؤسس والتواصل
            </Link>
          </div>
          <p className="mt-9 text-xs leading-7 text-[#796f62]">
            هذه صفحة تعريفية بمشروع ضاديوم وليست شهادة تسجيل شركة أو
            إثباتًا مستقلًا لملكية علامة تجارية.
          </p>
        </footer>
      </div>
    </main>
  );
}
