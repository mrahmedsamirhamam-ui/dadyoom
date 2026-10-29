import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "أحمد سمير حمام | مؤسس ضاديوم ومديرها",
  description: "أحمد سمير حمام (Ahmed Samir Hamam)، مؤسس ضاديوم ومديرها، وخبير في تعليم اللغة العربية وتطوير التعلم الرقمي.",
  alternates: { canonical: "/founder" },
  openGraph: {
    title: "أحمد سمير حمام — مؤسس ضاديوم",
    description: "تعرف على مؤسس مشروع ضاديوم ورؤيته في تعليم اللغة العربية.",
    url: "/founder",
  },
};

export default function FounderPage() {
  const base = getSiteUrl();
  const personId = `${base}/founder#person`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${base}/founder#profile`,
      url: `${base}/founder`,
      name: "أحمد سمير حمام | مؤسس ضاديوم",
      inLanguage: ["ar", "en"],
      mainEntity: {
        "@type": "Person",
        "@id": personId,
        name: "أحمد سمير حمام",
        alternateName: "Ahmed Samir Hamam",
        url: `${base}/founder`,
        jobTitle: ["مؤسس ضاديوم", "مدير ضاديوم", "Arabic Language Educator"],
        description: "مؤسس مشروع ضاديوم، وخبير في تعليم العربية والتطوير التربوي.",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "ضاديوم",
      alternateName: "Dadyoom",
      url: base,
      founder: { "@id": personId },
      description: "مشروع تعليمي رقمي لتطوير تعلم اللغة العربية.",
    },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] px-5 py-12 text-[#27231f] sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <article className="mx-auto max-w-4xl rounded-3xl border border-[#e2d4b8] bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-[#174f47] hover:underline">العودة إلى ضاديوم</Link>
        <p className="mt-7 font-bold text-[#a8782f]">مؤسس ضاديوم ومديرها | Founder &amp; Director of Dadyoom</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-[#174f47]">أحمد سمير حمام</h1>
        <p lang="en" dir="ltr" className="mt-2 text-left text-xl font-semibold text-[#655c51]">Ahmed Samir Hamam</p>
        <p className="mt-7 text-lg leading-9">تربوي متخصص في تعليم اللغة العربية، ويتمتع بخبرة تزيد على عشرين عامًا في التدريس والتطوير التربوي. أسّس ضاديوم — بيت العربية الرقمي — ويقود رؤيتها لتطوير تعليم العربية عبر مناهج منظمة وأنشطة تفاعلية وتقييمات وأدوات رقمية.</p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">رؤيته</h2>
        <p className="mt-3 leading-9">تيسير تعلم العربية دون التفريط في أصالتها، وتقديم مسارات تعلم تراعي الفروق الفردية وتعزز دور الطالب والمعلم وولي الأمر والمدرسة.</p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">مؤلفاته</h2>
        <ul className="mt-3 list-disc space-y-2 pr-6 leading-8">
          <li>التعليم بين التقليد والعصرنة: نحو نموذج عربي متوازن في عصر الذكاء الاصطناعي.</li>
          <li>هندسة التفكير والتعلّم: نحو تصميم أنظمة تعليمية عربية أصيلة.</li>
        </ul>
        <section lang="en" dir="ltr" className="mt-10 rounded-2xl bg-[#f5f0e5] p-6 text-left">
          <h2 className="text-2xl font-bold text-[#174f47]">About the Founder</h2>
          <p className="mt-3 leading-8">Ahmed Samir Hamam is the founder and director of Dadyoom, an Arabic-language education initiative. With more than 20 years of experience in teaching, he works to connect Arabic curricula, interactive learning, assessment, and educational technology.</p>
        </section>
        <p className="mt-7 text-sm leading-7 text-[#655c51]">هذه سيرة تعريفية بالمؤسس ولا تمثل شهادة تسجيل تجاري أو إثبات ملكية علامة تجارية.</p>
      </article>
    </main>
  );
}
