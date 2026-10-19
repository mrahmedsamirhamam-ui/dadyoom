import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "المناهج الدولية للعربية IB وIG وIGCSE | ضاديوم",
  description:
    "دليل مجاني بمصادر رسمية لمسارات العربية في IB PYP وMYP وDP وCambridge IGCSE وPearson Edexcel، مع أنشطة أصلية للطلاب والمعلمين وحالة التغطية الفعلية.",
  alternates: { canonical: "/courses/international-arabic" },
};

type Pathway = {
  key: string;
  group: "ib" | "cambridge" | "pearson";
  name: string;
  audience: string;
  level: string;
  authority: string;
  source: string;
  sourceLabel: string;
  evidence: string;
  status: "available-partial" | "source-mapped";
  learningFocus: string;
  teacherExample: string;
  studentCheck: string;
  route?: string;
};

const pathways: Pathway[] = [
  {
    key: "ib-pyp",
    group: "ib",
    name: "IB PYP — العربية عبر الاستقصاء",
    audience: "الناطقون بالعربية ومتعلموها؛ التخصيص حسب مستوى الطفل",
    level: "السنوات الابتدائية",
    authority: "International Baccalaureate",
    source: "https://ibo.org/programmes/primary-years-programme/curriculum/",
    sourceLabel: "إطار PYP الرسمي",
    evidence: "إطار للاستقصاء عابر للمواد، وليس كتاب لغة عربية موحدًا لجميع مدارس IB.",
    status: "source-mapped",
    learningFocus: "التحدث والاستماع والقراءة والكتابة في سياق سؤال يستكشفه الطفل",
    teacherExample: "سؤال الحصة: كيف نصنع صداقات طيبة؟ يقرأ التلاميذ قصة عربية أصلية، ثم يقترحون حلولًا لموقف واقعي.",
    studentCheck: "عبّر بجملتين عن حل مختلف، ثم وضّح لماذا اخترته.",
    route: "/courses/arabic-from-zero",
  },
  {
    key: "ib-myp-literature",
    group: "ib",
    name: "IB MYP — اللغة والأدب",
    audience: "الناطقون بالعربية أو من يدرسون العربية لغة وأدبًا",
    level: "السنوات المتوسطة",
    authority: "International Baccalaureate",
    source: "https://www-prod.ibo.org/programmes/middle-years-programme/curriculum/language-and-literature/",
    sourceLabel: "إطار MYP للغة والأدب",
    evidence: "يوجد في ضاديوم 31 درسًا منشورًا للفصل الأول بالصف الثامن في مسار البحرين MYP. لا يمثل ذلك تغطية MYP لكل السنوات أو الدول.",
    status: "available-partial",
    learningFocus: "التحليل الأدبي، تفسير الشواهد، التواصل، وتأمل أثر اللغة",
    teacherExample: "قارن راويين في نصين عربيين أصليين: من المتحدث؟ وما الشاهد الذي يؤيد تفسيرك؟",
    studentCheck: "قدّم تفسيرًا واحدًا مع شاهدين موثقين من النص المقروء.",
    route: "/courses?country=BH&grade=8",
  },
  {
    key: "ib-myp-acquisition",
    group: "ib",
    name: "IB MYP — اكتساب العربية",
    audience: "طلاب العربية لغة إضافية، حسب الكفاية الفعلية لا العمر وحده",
    level: "ست مراحل تعلم غير مرتبطة بصفوف ثابتة",
    authority: "International Baccalaureate",
    source: "https://www-prod.ibo.org/programmes/middle-years-programme/curriculum/language-acquisition/",
    sourceLabel: "إطار اكتساب اللغات MYP",
    evidence: "المراحل الست إطار للكفاية؛ لا توجد بعد حزمة عربية مستقلة معتمدة لكل مرحلة داخل ضاديوم.",
    status: "source-mapped",
    learningFocus: "فهم رسالة مسموعة، إنتاج حوار مناسب، قراءة قصيرة وكتابة وظيفية",
    teacherExample: "حوار في المكتبة: اطلب كتابًا، استوضح موعد إرجاعه، ثم لخّص ما فهمته.",
    studentCheck: "أكمل حوارًا مع مراعاة التحية والطلب والاستيضاح.",
    route: "/courses/arabic-from-zero",
  },
  {
    key: "ib-dp-a",
    group: "ib",
    name: "IB DP — Language A",
    audience: "متمكنو العربية الذين يدرسون اللغة والأدب",
    level: "الدبلوم",
    authority: "International Baccalaureate",
    source: "https://ibo.org/programmes/diploma-programme/curriculum/",
    sourceLabel: "مواد مجموعة اللغة والأدب في DP",
    evidence: "يجب التأكد من خيار المادة والمستوى SL/HL ومواصفة المدرسة؛ لم نتحقق من حزمة DP عربية منشورة في ضاديوم.",
    status: "source-mapped",
    learningFocus: "قراءة نقدية، التحليل الأسلوبي، المقارنة، وحجة مدعومة بالأدلة",
    teacherExample: "حلّل كيف يشكل اختيار الألفاظ موقف الكاتب من قضية اجتماعية في نص عربي مرخص.",
    studentCheck: "اكتب فقرة نقدية تتضمن دعوى وشاهدًا وتحليلًا لأسلوبه.",
    route: "/courses",
  },
  {
    key: "ib-dp-b",
    group: "ib",
    name: "IB DP — اكتساب اللغة (Language B)",
    audience: "الدارسون للعربية لغة إضافية، بحسب عرضها الفعلي في المدرسة",
    level: "الدبلوم",
    authority: "International Baccalaureate",
    source: "https://ibo.org/programmes/diploma-programme/curriculum/",
    sourceLabel: "مواد مجموعة اكتساب اللغة في DP",
    evidence: "تحقق من توفر العربية ونوع المادة ودورة التقييم لدى المدرسة قبل تسمية الدرس مطابقًا رسميًا.",
    status: "source-mapped",
    learningFocus: "التواصل بين الثقافات، فهم النصوص، وصياغة الرسائل والنقاشات",
    teacherExample: "اكتب رسالة تطوعية قصيرة بالعربية تدعو فيها زملاءك إلى نشاط يخدم الحي.",
    studentCheck: "قدّم فكرة وسببين ودعوة عملية بأسلوب مناسب للجمهور.",
    route: "/courses/arabic-from-zero",
  },
  {
    key: "cambridge-0508",
    group: "cambridge",
    name: "Cambridge IGCSE — First Language Arabic (0508)",
    audience: "متعلمون يتقنون العربية لغة أولى",
    level: "IGCSE — راجع سنة الامتحان",
    authority: "Cambridge International",
    source: "https://www.cambridgeinternational.org/Images/748883-2026-syllabus-arabic.pdf",
    sourceLabel: "المواصفة العربية الرسمية 2026",
    evidence: "للقراءة والكتابة متطلبات محددة؛ لا تعادل مجموعة أسئلة ضاديوم شهادة IGCSE أو التغطية الرسمية.",
    status: "source-mapped",
    learningFocus: "الفهم العميق للنصوص، التلخيص، التحليل الأسلوبي والكتابة الدقيقة",
    teacherExample: "قارن بين مقالة رأي وتقرير قصير من تأليف المعلم؛ استخرج الادعاء والدليل ونبرة الخطاب.",
    studentCheck: "اكتب تلخيصًا أمينًا وفكرة تحليلية تستند إلى لفظ محدد.",
    route: "/courses",
  },
  {
    key: "cambridge-0544",
    group: "cambridge",
    name: "Cambridge IGCSE — Foreign Language Arabic (0544)",
    audience: "متعلمو العربية لغة أجنبية",
    level: "IGCSE — مواصفة 2025–2027، مع إصدار جديد 2028–2030",
    authority: "Cambridge International",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-arabic-foreign-language-0544/",
    sourceLabel: "المواصفات الرسمية حسب سنة الامتحان",
    evidence: "يركز البرنامج على الاستماع والتحدث والقراءة والكتابة؛ يجب اختيار مواصفة سنة الاختبار المناسبة.",
    status: "source-mapped",
    learningFocus: "التواصل الواقعي في الحياة اليومية بأربع مهارات",
    teacherExample: "تبادل دور البائع والمشتري في مكتبة: استمع للسعر، اقرأ البطاقة، اطرح سؤالًا واكتب طلبًا.",
    studentCheck: "استمع إلى جملة أصلية ثم أجب، وقدم طلبًا شفويًا وجملة مكتوبة سليمة.",
    route: "/courses/arabic-from-zero",
  },
  {
    key: "cambridge-7180",
    group: "cambridge",
    name: "Cambridge IGCSE (9–1) — Arabic (7180)",
    audience: "دارسو العربية ذوو الخبرة السابقة؛ يتحدد التوفر حسب منطقة الامتحان",
    level: "IGCSE (9–1) — 2026–2028",
    authority: "Cambridge International",
    source: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-arabic-9-1-7180/",
    sourceLabel: "المواصفة ونطاق توافر الاختبار الرسمي",
    evidence: "هذا مسار مستقل عن 0508 و0544، ومتاح في مناطق إدارية محددة؛ تحقق من منطقة المدرسة.",
    status: "source-mapped",
    learningFocus: "الدقة اللغوية، تنوع النصوص، التعبير الكتابي والحجج الواضحة",
    teacherExample: "حرر فقرة تعرض موقفًا مع شاهد ثم أعد صياغتها لقراء مختلفين.",
    studentCheck: "أصلح ثلاثة تراكيب وفسر أثر التعديل في المعنى.",
    route: "/courses",
  },
  {
    key: "pearson-first",
    group: "pearson",
    name: "Pearson Edexcel International GCSE — Arabic First Language",
    audience: "طلاب المدارس الدولية دارسو العربية لغة أولى",
    level: "International GCSE (9–1)",
    authority: "Pearson Edexcel",
    source: "https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses/international-gcse-arabic-as-1st-language-2017.html",
    sourceLabel: "صفحة المؤهل والمواصفة الرسمية",
    evidence: "مواصفة مستقلة عن Cambridge؛ تأكد من أحدث وثائق المقرر ومواعيد الامتحان عند إعداد خطة المدرسة.",
    status: "source-mapped",
    learningFocus: "فهم المقروء والتعبير الدقيق واللغة والقواعد في مواقف متنوعة",
    teacherExample: "انقد مقالًا عربيًا قصيرًا حول أثر التقنية في القراءة، ثم اكتب ردًا منظمًا وواضحًا.",
    studentCheck: "حدد الفكرة الرئيسة وصحح خطأً نحويًا وأنتج فقرة بحجة مدعومة.",
    route: "/courses",
  },
];

const groups = [
  { key: "ib", name: "البكالوريا الدولية IB", description: "PYP للاستقصاء، وMYP للغة والأدب أو اكتساب اللغة، وDP للمرحلة المتقدمة." },
  { key: "cambridge", name: "Cambridge — IG وIGCSE", description: "اختيار رقم مادة العربية وسنة الامتحان أمر ضروري؛ IG ليس مواصفة موحدة." },
  { key: "pearson", name: "Pearson Edexcel — International GCSE", description: "مواصفات ومستندات مستقلة، تختلف عن Cambridge حتى مع تشابه المرحلة الدراسية." },
] as const;

export default function InternationalArabicPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#faf5e9] px-4 py-8 text-[#123f39] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl space-y-9">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-[#b99453] bg-[#103b35] px-5 py-9 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-72 w-72 rounded-full border-[40px] border-[#e1bd78]/10" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-black text-[#f2d39b]">ضاديوم — بيت اللغة العربية، لكل إنسان في كل مكان</p>
              <h1 className="font-arabic-display text-3xl font-black leading-[1.55] sm:text-5xl">العربية في المناهج الدولية</h1>
              <p className="font-arabic-reading text-lg leading-9 text-[#f4ecde]">
                دليل مجاني للطلاب والمعلمين حول العالم: افهم مسارك الرسمي، وتعرّف إلى ما هو منشور فعلًا،
                وابدأ أنشطة عربية أصلية تضع الفصاحة والفهم والإبداع في قلب التعلم.
              </p>
            </div>
            <Image src="/brand/dadyoom-logo-inverse.webp" width={145} height={90} alt="ضاديوم" className="h-auto w-32 object-contain" />
          </div>
          <div className="relative z-10 mt-7 flex flex-wrap gap-3">
            <Link href="#programmes" className="inline-flex min-h-11 items-center rounded-xl bg-[#e4be74] px-5 py-3 text-sm font-black text-[#143a34]">استكشف البرامج</Link>
            <Link href="#teacher-guide" className="inline-flex min-h-11 items-center rounded-xl border border-white/55 px-5 py-3 text-sm font-black text-white">إرشادات المعلمين</Link>
            <Link href="/courses/arabic-from-zero" className="inline-flex min-h-11 items-center rounded-xl border border-white/55 px-5 py-3 text-sm font-black text-white">العربية من الصفر</Link>
          </div>
        </section>

        <section aria-label="حالة التغطية" className="rounded-2xl border border-[#dfd0ad] bg-white p-5">
          <h2 className="text-xl font-black">ما المتاح فعلًا اليوم؟</h2>
          <p className="mt-2 font-arabic-reading text-base leading-8">
            لدينا <strong>31 درسًا منشورًا لمسار MYP للغة والأدب — الصف الثامن، الفصل الأول في البحرين</strong>.
            بقية المسارات أدناه هي <strong>أطر رسمية ودليل بناء وتدريس</strong> وليست مناهج امتحانية مكتملة
            داخل ضاديوم بعد. لا يُنسب المحتوى الأصلي لضاديوم إلى IB أو Cambridge أو Pearson،
            ولا نعيد نشر كتب أو أسئلة محمية دون ترخيص.
          </p>
          <p className="mt-2 text-sm text-[#73684f]">آخر تحقق تحريري: 19 أكتوبر 2026 • يختلف توفر المواد ومواعيد التقييم حسب البرنامج والمدرسة والدولة.</p>
        </section>

        <div id="programmes" className="space-y-9">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.name} className="space-y-4">
              <div>
                <h2 className="font-arabic-display text-2xl font-black sm:text-3xl">{group.name}</h2>
                <p className="mt-2 text-base leading-8 text-[#605b4f]">{group.description}</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {pathways.filter((item) => item.group === group.key).map((item) => (
                  <article key={item.key} className="flex flex-col rounded-[1.7rem] border border-[#dfcfac] bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[#e8f3ed] px-3 py-1 text-xs font-black text-[#205c4b]">{item.level}</span>
                      <span className="rounded-lg border border-[#e0d3bb] bg-[#fffbf3] px-3 py-1 text-xs font-bold text-[#705733]">
                        {item.status === "available-partial" ? "دروس منشورة جزئيًا" : "مرجع موثق — إعداد الدروس مستمر"}
                      </span>
                    </div>
                    <h3 className="text-xl font-black leading-9">{item.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#686256]">{item.audience}</p>
                    <p className="mt-4 rounded-xl border-r-4 border-[#b78b3e] bg-[#f9f3e6] p-3 text-sm leading-7"><strong>حالة التغطية:</strong> {item.evidence}</p>
                    <dl className="mt-4 space-y-3 text-sm leading-7">
                      <div><dt className="font-black">مهارة الطالب</dt><dd>{item.learningFocus}</dd></div>
                      <div><dt className="font-black">نشاط أصلي مقترح للمعلم</dt><dd>{item.teacherExample}</dd></div>
                      <div><dt className="font-black">كيف أتحقق من التعلم؟</dt><dd>{item.studentCheck}</dd></div>
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      <a href={item.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-[#123f39] px-4 py-2 text-sm font-black text-white hover:bg-[#1b5c53]">
                        المصدر الرسمي ↗
                      </a>
                      {item.route ? <Link href={item.route} className="inline-flex min-h-11 items-center rounded-xl border border-[#b99b67] px-4 py-2 text-sm font-black text-[#123f39]">ابدأ محتوى ضاديوم</Link> : null}
                    </div>
                    <p className="mt-3 text-xs text-[#787164]">{item.authority} • {item.sourceLabel}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="teacher-guide" className="space-y-5 rounded-[2rem] border border-[#c7b48d] bg-[#eef5ed] p-5 sm:p-8">
          <h2 className="font-arabic-display text-2xl font-black sm:text-3xl">ركن المعلم: من المواصفة إلى حصة يُحبها الطالب</h2>
          <p className="font-arabic-reading text-base leading-8">نستخدم هذا التسلسل في إعداد محتوى أصلي لكل مدرسة، مع الاحتفاظ بحق المعلم في التعديل والاعتماد:</p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["١", "حدّد البرنامج والمادة والسنة", "مثال: 0544 بدل 0508، أو MYP اكتساب اللغة بدل اللغة والأدب."],
              ["٢", "شخّص لغة المتعلم", "حدد الناطق بها أو المتعلم الجديد، ومستوى القراءة والفهم والتحدث الفعلي."],
              ["٣", "اربط الهدف بناتج قابل للملاحظة", "استخرج دليلًا، اطلب حوارًا، أو اكتب فقرة، حسب المواصفة الحقيقية."],
              ["٤", "قدّم ثلاث درجات نشاط", "دعم بتلميحات؛ تطبيق مستقل؛ إثراء بالتحليل أو الإبداع."],
              ["٥", "أضف لعبة وتقويمًا مناسبين", "لا نقيس تعلم الطالب بسؤال عن عنوان الدرس؛ نختبر نقل المهارة إلى سياق جديد."],
              ["٦", "راجع المصدر والنتيجة", "تحقق من حقوق النص والصوت، وسلامة المفتاح، وتغذية الطالب الراجعة."],
            ].map(([number,heading,body]) => (
              <li key={number} className="rounded-2xl border border-[#c7ddca] bg-white p-4">
                <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-[#123f39] text-lg font-black text-white">{number}</span>
                <h3 className="mt-3 font-black">{heading}</h3>
                <p className="mt-2 text-sm leading-7 text-[#585f56]">{body}</p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Link href="/courses" className="rounded-xl bg-[#123f39] px-5 py-3 text-sm font-black text-white">دليل الدروس والمناهج</Link>
            <Link href="/courses/video-library" className="rounded-xl border border-[#b59b66] bg-white px-5 py-3 text-sm font-black">مكتبة المرئيات</Link>
          </div>
          <p className="text-xs leading-6 text-[#5c6d62]">
            التنبيه المهني: هذا ركن موارد أصلية ومداخل إلى المواصفات؛ ليس جهة امتحانات أو جهة اعتماد ولا يوفر مكتبات مؤسسات التقويم الخاصة أو المحمية.
          </p>
        </section>
      </div>
    </main>
  );
}
