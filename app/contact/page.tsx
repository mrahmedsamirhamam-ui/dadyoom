import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "تواصل معنا | ضاديوم",
  description: "وسائل التواصل الرسمية مع فريق ضاديوم، بما في ذلك الهاتف في مصر وصفحات فيسبوك وإنستغرام ولينكدإن وتيك توك ويوتيوب والبريد الإلكتروني.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] px-5 py-12 text-[#27231f] sm:py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-[#e2d4b8] bg-white p-7 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-bold text-[#174f47] hover:underline">العودة إلى ضاديوم</Link>
        <h1 className="mt-6 text-4xl font-black text-[#174f47]">تواصل معنا</h1>
        <p className="mt-5 text-lg leading-9">يسعد فريق ضاديوم استقبال استفساراتكم ومقترحاتكم. يمكن التواصل عبر رقم مصر التالي، سواء كانت إدارة المشروع تعمل من مصر أو من خارجها.</p>
        <section aria-labelledby="egypt-contact" className="mt-8 rounded-2xl border border-[#d7e5dc] bg-[#f8faf6] p-6">
          <h2 id="egypt-contact" className="text-xl font-bold text-[#174f47]">التواصل الهاتفي — مصر 🇪🇬</h2>
          <a dir="ltr" href="tel:+201503113009" className="mt-4 inline-block text-xl font-bold text-[#174f47] underline underline-offset-4" aria-label="اتصل بضاديوم على الرقم المصري">+20 150 311 3009</a>
          <p className="mt-3 text-sm leading-7 text-[#655c51]">تُحسب تكلفة المكالمة وفق تعرفة شركة الاتصالات. لا يُفترض توفر واتساب على الرقم إلا بعد تأكيد ذلك.</p>
        </section>
        <section aria-labelledby="email-contact" className="mt-6 rounded-2xl border border-[#d7e5dc] bg-[#f8faf6] p-6">
          <h2 id="email-contact" className="text-xl font-bold text-[#174f47]">البريد الإلكتروني — إدارة مدارس ضاديوم الدولية</h2>
          <a dir="ltr" href="mailto:dadyoominternationalschool@gmail.com" className="mt-4 inline-block break-all font-semibold text-[#174f47] underline underline-offset-4">dadyoominternationalschool@gmail.com</a>
          <p className="mt-3 text-sm leading-7 text-[#655c51]">هذا البريد مخصص لمراسلات المدارس الدولية، وليس بريد الدعم العام لجميع خدمات المنصة.</p>
        </section>
        <section aria-labelledby="social-contact" className="mt-6 rounded-2xl border border-[#d7e5dc] bg-[#f8faf6] p-6">
          <h2 id="social-contact" className="text-xl font-bold text-[#174f47]">التواصل عبر مواقع التواصل الاجتماعي</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://www.facebook.com/share/1A2Uag89ay/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#174f47] px-5 py-3 font-semibold text-white hover:opacity-90" aria-label="صفحة التواصل عبر فيسبوك">فيسبوك</a>
            <a href="https://www.instagram.com/mrahmedsamirhamam/" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#174f47] px-5 py-3 font-semibold text-white hover:opacity-90" aria-label="حساب التواصل عبر إنستغرام">إنستغرام</a>
            <a href="https://www.linkedin.com/in/ahmedsamirmohamedhafez" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#174f47] px-5 py-3 font-semibold text-white hover:opacity-90" aria-label="الملف المهني على لينكدإن">لينكدإن</a>
            <a href="https://www.tiktok.com/@mr.ahmed.samir.ha6" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#174f47] px-5 py-3 font-semibold text-white hover:opacity-90" aria-label="حساب تيك توك">تيك توك</a>
            <a href="https://www.youtube.com/@mrahmedsamirhamam" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#174f47] px-5 py-3 font-semibold text-white hover:opacity-90" aria-label="قناة يوتيوب">يوتيوب</a>
          </div>
        </section>
      </article>
    </main>
  );
}
