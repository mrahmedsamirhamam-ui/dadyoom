import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "أ. أحمد سمير محمد حافظ حمام | مؤسس ضاديوم ومديرها",
  description: "أ. أحمد سمير محمد حافظ حمام (Mr Ahmed Samir Mohamed Hafez Hamam)، مؤسس ضاديوم ومديرها، وخبير في تعليم اللغة العربية وتطوير التعلم الرقمي.",
  alternates: { canonical: "/founder" },
  openGraph: {
    title: "أ. أحمد سمير محمد حافظ حمام — مؤسس ضاديوم",
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
      name: "أ. أحمد سمير محمد حافظ حمام | مؤسس ضاديوم",
      inLanguage: ["ar", "en"],
      mainEntity: {
        "@type": "Person",
        "@id": personId,
        name: "أ. أحمد سمير محمد حافظ حمام",
        alternateName: "Mr Ahmed Samir Mohamed Hafez Hamam",
        url: `${base}/founder`,
        jobTitle: ["مؤسس ضاديوم", "مدير ضاديوم", "Arabic Language Educator"],
        description: "مؤسس مشروع ضاديوم، وخبير في تعليم العربية والتطوير التربوي.",
        sameAs: ["https://www.linkedin.com/in/ahmedsamirmohamedhafez", "https://www.instagram.com/mrahmedsamirhamam/", "https://www.facebook.com/share/1A2Uag89ay/", "https://www.tiktok.com/@mr.ahmed.samir.ha6", "https://www.youtube.com/@mrahmedsamirhamam"],
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
        <h1 className="mt-3 text-4xl font-black leading-tight text-[#174f47]">أ. أحمد سمير محمد حافظ حمام</h1>
        <p lang="en" dir="ltr" className="mt-2 text-left text-xl font-semibold text-[#655c51]">Mr Ahmed Samir Mohamed Hafez Hamam</p>
        <p className="mt-7 text-lg leading-9">تربوي متخصص في تعليم اللغة العربية، ويتمتع بخبرة تزيد على عشرين عامًا في التدريس والتطوير التربوي. أسّس ضاديوم — بيت العربية الرقمي — ويقود رؤيتها لتطوير تعليم العربية عبر مناهج منظمة وأنشطة تفاعلية وتقييمات وأدوات رقمية.</p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">رؤيته</h2>
        <p className="mt-3 leading-9">تيسير تعلم العربية دون التفريط في أصالتها، وتقديم مسارات تعلم تراعي الفروق الفردية وتعزز دور الطالب والمعلم وولي الأمر والمدرسة.</p>
        <h2 className="mt-9 text-2xl font-bold text-[#174f47]">مؤلفاته</h2>
        <ul className="mt-3 list-disc space-y-2 pr-6 leading-8">
          <li>التعليم بين التقليد والعصرنة: نحو نموذج عربي متوازن في عصر الذكاء الاصطناعي.</li>
          <li>هندسة التفكير والتعلّم: نحو تصميم أنظمة تعليمية عربية أصيلة.</li>
        </ul>
        <section className="mt-9 rounded-2xl border border-[#d7e5dc] bg-[#f8faf6] p-6">
          <h2 className="text-2xl font-bold text-[#174f47]">الحسابات المهنية والاجتماعية للمؤسس</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <a href="https://www.linkedin.com/in/ahmedsamirmohamedhafez" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#174f47] underline">لينكدإن</a>
            <a href="https://www.facebook.com/share/1A2Uag89ay/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#174f47] underline">فيسبوك</a>
            <a href="https://www.instagram.com/mrahmedsamirhamam/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#174f47] underline">إنستغرام</a>
            <a href="https://www.tiktok.com/@mr.ahmed.samir.ha6" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#174f47] underline">تيك توك</a>
            <a href="https://www.youtube.com/@mrahmedsamirhamam" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#174f47] underline">يوتيوب</a>
          </div>
          <p className="mt-4 text-sm text-[#655c51]">هذه الروابط للتعريف بالمؤسس ولا تُعد بمفردها إثباتًا قانونيًا للملكية.</p>
        </section>
        <section lang="en" dir="ltr" className="mt-10 rounded-2xl bg-[#f5f0e5] p-6 text-left">
          <h2 className="text-2xl font-bold text-[#174f47]">About the Founder</h2>
          <p className="mt-3 leading-8">Mr Ahmed Samir Mohamed Hafez Hamam is the founder and director of Dadyoom, an Arabic-language education initiative. With more than 20 years of experience in teaching, he works to connect Arabic curricula, interactive learning, assessment, and educational technology.</p>
        </section>
        <p className="mt-7 text-sm leading-7 text-[#655c51]">هذه سيرة تعريفية بالمؤسس ولا تمثل شهادة تسجيل تجاري أو إثبات ملكية علامة تجارية.</p>
      </article>
    </main>
  );
}
