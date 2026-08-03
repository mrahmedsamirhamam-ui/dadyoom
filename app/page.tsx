import Link from "next/link";

const features = [
  {
    icon: "🤖",
    title: "ضاد، رفيقك الذكي",
    text: "اسأل، تعلّم، وتدرّب مع مساعد ذكي يفهم احتياجاتك التعليمية.",
  },
  {
    icon: "📚",
    title: "مناهج عربية متعددة",
    text: "محتوى منظم يلائم المناهج العربية والمراحل الدراسية المختلفة.",
  },
  {
    icon: "🎯",
    title: "تعلّم يناسب مستواك",
    text: "أنشطة ومسارات مقترحة تتكيف مع مستوى الطالب وتقدمه.",
  },
  {
    icon: "🏆",
    title: "تحفيز مستمر",
    text: "نقاط وشارات وأهداف أسبوعية تشجعك على الاستمرار.",
  },
];

const skills = [
  { icon: "📖", title: "القراءة", text: "فهم النصوص وتحليلها" },
  { icon: "✍️", title: "الكتابة", text: "التعبير والإملاء" },
  { icon: "🎧", title: "الاستماع", text: "الفهم السمعي والتدريب" },
  { icon: "🎙️", title: "التحدث", text: "النطق والتعبير الشفهي" },
];

const steps = [
  { number: "01", title: "حدّد مستواك", text: "اختر المرحلة والهدف الذي تريد الوصول إليه." },
  { number: "02", title: "ابدأ رحلتك", text: "تعلّم من دروس قصيرة وأنشطة تفاعلية." },
  { number: "03", title: "تابع تقدمك", text: "راقب إنجازاتك واحصل على اقتراحات مناسبة." },
];

const faqs = [
  {
    q: "لمن صُممت ضاديوم؟",
    a: "للطلاب والمعلمين وأولياء الأمور والمدارس في مختلف الدول العربية.",
  },
  {
    q: "هل يمكن تجربة ضاد قبل التسجيل؟",
    a: "نعم، يمكنك تجربة المساعد الذكي والاطلاع على محتوى المنصة قبل إنشاء حساب.",
  },
  {
    q: "هل تدعم المنصة المهارات الأربع؟",
    a: "نعم، تشمل القراءة والكتابة والاستماع والتحدث، إضافة إلى النحو والإملاء والمفردات.",
  },
];

export default function HomePage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-xl font-black text-white shadow-sm">
              ض
            </div>
            <div>
              <div className="text-xl font-black text-teal-700">ضاديوم</div>
              <div className="text-xs font-semibold text-slate-500">بيت العربية الرقمي</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-teal-700">المميزات</a>
            <a href="#skills" className="transition hover:text-teal-700">المهارات</a>
            <a href="#how" className="transition hover:text-teal-700">كيف تبدأ؟</a>
            <a href="#faq" className="transition hover:text-teal-700">الأسئلة الشائعة</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 sm:inline-flex"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/student"
              className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-700"
            >
              ابدأ الآن
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-white to-white">
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2 text-sm font-black text-teal-700 shadow-sm">
              <span>✨</span>
              العربية تجمعنا
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.25] text-slate-950 sm:text-5xl lg:text-6xl">
              تعلّم العربية بطريقة
              <span className="block text-teal-700">تفاعلية وذكية</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-9 text-slate-600">
              منصة عربية شاملة تجمع الدروس والأنشطة والاختبارات والمساعد الذكي في تجربة تعليمية واحدة تناسب الطالب والمعلم والمدرسة.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/student"
                className="rounded-2xl bg-teal-600 px-6 py-3.5 font-black text-white shadow-lg shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
              >
                ابدأ التعلم
              </Link>
              <Link
                href="/ask"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3.5 font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700"
              >
                جرّب ضاد
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              <MiniStat value="+8" label="مجالات تعليمية" />
              <MiniStat value="4" label="مهارات أساسية" />
              <MiniStat value="24/7" label="مساعدة ذكية" />
            </div>
          </div>

          <div className="relative">
            <div className="mx-auto max-w-lg rounded-[2.5rem] border border-teal-100 bg-white p-5 shadow-2xl shadow-teal-900/10">
              <div className="rounded-[2rem] bg-gradient-to-br from-teal-600 to-emerald-500 p-7 text-white">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-sm font-bold text-teal-100">رفيق التعلم الذكي</p>
                    <h2 className="mt-2 text-3xl font-black">مرحبًا، أنا ضاد 👋</h2>
                    <p className="mt-3 leading-7 text-teal-50">
                      اسألني عن معنى كلمة، قاعدة نحوية، أو اطلب تدريبًا يناسب مستواك.
                    </p>
                  </div>
                  <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-3xl border-4 border-amber-300 bg-teal-800 text-4xl font-black text-amber-300 shadow-lg">
                    ض
                  </div>
                </div>

                <div className="mt-7 rounded-2xl bg-white/15 p-4 backdrop-blur">
                  <div className="text-xs font-bold text-teal-100">مثال سريع</div>
                  <div className="mt-2 font-black">ما معنى كلمة «الازدهار»؟</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-2 pt-5">
                <InfoCard icon="📘" title="درس قصير" text="تعلّم في دقائق" />
                <InfoCard icon="🎯" title="نشاط فوري" text="طبّق ما تعلّمت" />
                <InfoCard icon="📈" title="تقدم واضح" text="راقب إنجازك" />
                <InfoCard icon="🏆" title="مكافآت" text="استمر وتفوّق" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="لماذا ضاديوم؟"
            title="كل ما تحتاجه لتعلّم العربية"
            text="تجربة تعليمية مترابطة تجمع المحتوى والتفاعل والمتابعة في مكان واحد."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="المهارات الأربع"
            title="تعلّم اللغة كما تُستخدم"
            text="مسارات عملية تساعد الطالب على تطوير مهاراته بصورة متوازنة."
          />

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {skills.map((skill) => (
              <div
                key={skill.title}
                className="group rounded-3xl border border-slate-200 p-6 transition hover:border-teal-300 hover:bg-teal-50/50"
              >
                <div className="text-4xl">{skill.icon}</div>
                <h3 className="mt-4 text-xl font-black group-hover:text-teal-700">{skill.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{skill.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-teal-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            dark
            eyebrow="كيف تبدأ؟"
            title="ثلاث خطوات فقط"
            text="ابدأ بسرعة، وحقق أول إنجاز من اللحظات الأولى."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                <div className="text-4xl font-black text-amber-300">{step.number}</div>
                <h3 className="mt-5 text-xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-teal-100">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="الأسئلة الشائعة"
            title="كل ما تريد معرفته"
            text="إجابات سريعة عن تجربة ضاديوم."
          />

          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer list-none font-black text-slate-900">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-teal-700 transition group-open:rotate-45">＋</span>
                  </span>
                </summary>
                <p className="mt-4 border-t border-slate-100 pt-4 leading-7 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-teal-700 to-emerald-500 p-8 text-white shadow-xl sm:p-12">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black sm:text-4xl">جاهز لبدء رحلة العربية؟</h2>
              <p className="mt-3 max-w-2xl leading-8 text-teal-50">
                ابدأ الآن، واكتشف تجربة تعليمية صُممت لتصل العربية إلى قلب الطالب قبل عقله.
              </p>
            </div>
            <Link
              href="/student"
              className="inline-flex shrink-0 justify-center rounded-2xl bg-white px-7 py-4 font-black text-teal-700 transition hover:-translate-y-0.5"
            >
              ابدأ مجانًا
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 py-10 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="text-xl font-black text-white">ضاديوم</div>
            <p className="mt-2 text-sm">بيت العربية الرقمي — العربية تجمعنا، ولا تُذيب أحدًا.</p>
          </div>
          <div className="text-sm">© 2026 ضاديوم. جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className={`text-sm font-black ${dark ? "text-amber-300" : "text-teal-700"}`}>{eyebrow}</div>
      <h2 className={`mt-3 text-3xl font-black sm:text-4xl ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>
      <p className={`mt-4 leading-8 ${dark ? "text-teal-100" : "text-slate-600"}`}>{text}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-xl font-black text-teal-700">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-500">{label}</div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-black text-slate-900">{title}</div>
      <div className="mt-1 text-xs font-semibold text-slate-500">{text}</div>
    </div>
  );
}
