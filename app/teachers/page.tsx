import type { Metadata } from "next";
import Link from "next/link";

import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "ذكاء اصطناعي للمعلمين | تحضير الدروس وأوراق العمل والاختبارات",
  description:
    "ضاديوم للمعلمين: أنشئ حزمة درس عربية كاملة بالذكاء الاصطناعي تشمل أهداف بلوم، خطة الحصة، أنشطة متمايزة، ورقة عمل، اختبارًا، واجبًا، مخطط شرائح، PowerPoint وQR.",
  keywords: [
    "ذكاء اصطناعي للمعلمين",
    "تحضير الدروس بالذكاء الاصطناعي",
    "خطة درس لغة عربية",
    "ورقة عمل لغة عربية",
    "اختبارات لغة عربية",
    "أهداف بلوم",
    "Dadyoom Teacher Studio",
  ],
  alternates: {
    canonical: "/teachers",
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    title: "ضاديوم للمعلمين | Teacher Studio",
    description:
      "من الدرس إلى خطة الحصة وورقة العمل والاختبار والعرض وQR داخل منصة عربية واحدة.",
    url: "/teachers",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const features = [
  {
    title: "خطة حصة قابلة للتنفيذ",
    text: "حدد مدة الحصة مثل 45 أو 55 أو 60 دقيقة، ويحصل المعلم على تسلسل زمني واضح للتهيئة والتعلم النشط والتقويم.",
  },
  {
    title: "أهداف وفق بلوم",
    text: "أهداف معرفية ومهارية ووجدانية بأفعال قابلة للقياس، مرتبطة مباشرة بمحتوى الدرس.",
  },
  {
    title: "تمايز لثلاثة مستويات",
    text: "دعم للمتعثرين، نشاط للمستوى المتوقع، وإثراء للطلاب المتقدمين داخل الحزمة نفسها.",
  },
  {
    title: "ورقة عمل واختبار",
    text: "أسئلة متنوعة مع الإجابات تشمل الاختيار من متعدد والصواب والخطأ والإجابة القصيرة والتحليل.",
  },
  {
    title: "عرض إلكتروني",
    text: "مخطط شرائح تفاعلي للدرس مع أسئلة وأنشطة، إضافة إلى PowerPoint عندما يكون متاحًا للدرس.",
  },
  {
    title: "QR وألعاب تعليمية",
    text: "اربط الدرس بالكتاب أو ورقة العمل عبر QR، واستخدم الألعاب والتقويمات الرقمية الموجودة داخل ضاديوم.",
  },
];

const faq = [
  {
    q: "ما هو Dadyoom Teacher Studio؟",
    a: "أداة داخل ضاديوم تساعد المعلم على تحويل الدرس المنشور إلى حزمة تعليمية متكاملة تشمل التخطيط والتمايز وورقة العمل والتقويم والعرض.",
  },
  {
    q: "هل يمكن إعداد خطة درس لمدة 55 دقيقة؟",
    a: "نعم. يختار المعلم مدة الحصة، ومنها 55 دقيقة، ثم يبني ضاديوم سير الحصة والأنشطة والتقويم بما يناسب المدة.",
  },
  {
    q: "هل يدعم ضاديوم أوراق العمل والاختبارات؟",
    a: "نعم. تتضمن الحزمة أسئلة متنوعة مع إجابات مقترحة، ويمكن للمعلم تعديلها بما يلائم طلابه.",
  },
  {
    q: "هل ترتبط الحزمة بالمنهج والدرس؟",
    a: "نعم. الإنشاء يعتمد على محتوى الدرس الموجود في ضاديوم بدل البدء من صفحة فارغة، مع إمكانية فتح الدرس وموارده المرتبطة.",
  },
];

export default function TeachersPage() {
  const site = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Dadyoom Teacher Studio",
      alternateName: "ضاديوم للمعلمين",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: site + "/teachers",
      description:
        "أداة عربية للمعلمين لإنشاء خطط الدروس وأوراق العمل والاختبارات والأنشطة المتمايزة بالذكاء الاصطناعي.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f1e6] px-4 py-12 text-[#202c29]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 text-sm font-bold text-[#6d665c]">
          <Link href="/" className="hover:underline">
            ضاديوم
          </Link>
          <span className="mx-2">←</span>
          <span>للمعلمين</span>
        </nav>

        <header className="overflow-hidden rounded-[2.2rem] bg-[#123f39] p-8 text-white shadow-xl sm:p-12">
          <p className="text-sm font-black text-[#e8c77a]">
            Dadyoom Teacher Studio
          </p>
          <h1 className="mt-3 max-w-4xl font-arabic-display text-4xl font-black leading-[1.45] sm:text-5xl">
            تحضير الدروس بالذكاء الاصطناعي للمعلم العربي
          </h1>
          <p className="mt-5 max-w-3xl font-arabic-reading text-lg leading-9 text-[#edf7f4]">
            لا تبدأ من صفحة فارغة. اختر الدرس من ضاديوم وحوّله إلى خطة حصة
            وأهداف بلوم وأنشطة متمايزة وورقة عمل واختبار وواجب ومخطط عرض،
            مع PowerPoint وQR والألعاب التعليمية المرتبطة بالدرس.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-2xl bg-[#e8c77a] px-6 py-3 font-black text-[#123f39]"
            >
              ابدأ كمعلم
            </Link>
            <Link
              href="/curriculum"
              className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-black text-white"
            >
              استعرض المناهج
            </Link>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-3xl font-black text-[#123f39]">
            ماذا يصنع ضاديوم للمعلم؟
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-[#ddcfb4] bg-[#fffdf8] p-6 shadow-sm"
              >
                <h3 className="text-xl font-black text-[#174f47]">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-8 text-[#655e54]">
                  {feature.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-7 sm:p-9">
          <p className="text-sm font-black text-[#9a712c]">
            من المنهج إلى الحصة
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#123f39]">
            كل شيء يبدأ من الدرس نفسه
          </h2>
          <p className="mt-4 max-w-4xl leading-9 text-[#655e54]">
            يتصل Teacher Studio بدروس ضاديوم، لذلك يستطيع المعلم اختيار
            الدرس ثم تحديد مدة الحصة ومستوى الصف. بعد ذلك تُبنى الحزمة حول
            المحتوى الفعلي للدرس، لا حول قالب عام منفصل عن المنهج.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/curriculum/bh"
              className="rounded-xl bg-[#123f39] px-5 py-3 font-black text-white"
            >
              مناهج البحرين
            </Link>
            <Link
              href="/learn-arabic"
              className="rounded-xl border border-[#cdbb96] px-5 py-3 font-black text-[#174f47]"
            >
              تعلّم العربية
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-3xl font-black text-[#123f39]">
            أسئلة شائعة
          </h2>
          <div className="mt-5 space-y-3">
            {faq.map((item) => (
              <details
                key={item.q}
                className="rounded-2xl border border-[#ddcfb4] bg-[#fffdf8] p-5"
              >
                <summary className="cursor-pointer font-black text-[#174f47]">
                  {item.q}
                </summary>
                <p className="mt-3 leading-8 text-[#655e54]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] bg-[#ead9b8] p-8 text-center">
          <h2 className="text-3xl font-black text-[#123f39]">
            من فكرة الدرس إلى حصة جاهزة داخل منصة واحدة
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-8 text-[#5e564c]">
            افتح حساب المعلم في ضاديوم، ثم اختر الدرس وابدأ إنشاء الحزمة
            التعليمية مباشرة.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex rounded-2xl bg-[#123f39] px-7 py-3 font-black text-white"
          >
            إنشاء حساب
          </Link>
        </section>
      </div>
    </main>
  );
}
