import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/contact/ContactForm";
import MyCareRequests from "@/components/contact/MyCareRequests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ضاديوم معك | صوتك يُسمَع، ورأيك يصنع الفرق",
  description: "اتصل بفريق ضاديوم، وأرسل مشكلة تقنية أو ملاحظة منهجية أو استفسارًا أو اقتراحًا بسهولة.",
  alternates: { canonical: "/contact" },
};

const help = [
  { title: "تسجيل الدخول والحساب", text: "اختر «تسجيل الدخول والحساب» واذكر ما يحدث بعد تسجيل الدخول دون مشاركة كلمات المرور." },
  { title: "مشكلة في الدرس أو المنهج", text: "اذكر الدولة والصف واسم الدرس ورابطه والخطأ الملحوظ لمساعدتنا على مراجعته." },
  { title: "المعلم والمدرسة", text: "طلبات دعم المعلمين والفصول والتعاون المؤسسي تصل عبر النموذج نفسه." },
  { title: "الخصوصية والاقتراحات", text: "يمكنك تقديم ملاحظات التطوير أو طلب متعلق بالبيانات؛ قد نتحقق من الهوية قبل أي إجراء حساس." },
];

export default function ContactPage() {
  // Contact details approved by Dadyoom founder on 15 October 2026.
  // Country calling code +973 is Bahrain; wa.me requires digits without +.
  const email = "mrahmedsamirhamam@gmail.com";
  const whatsapp = "97338921189";

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <nav className="mb-6 flex flex-wrap items-center gap-4 text-sm font-bold text-[#174f47]">
          <Link href="/" className="hover:underline">الرئيسية</Link>
          <span>←</span>
          <span>تواصل معنا</span>
          <Link href="/privacy" className="mr-auto hover:underline">سياسة الخصوصية</Link>
        </nav>
        <header className="relative overflow-hidden rounded-[2rem] border border-[#d7c29c] bg-[#123f39] px-6 py-10 text-white sm:px-10">
          <div aria-hidden="true" className="absolute -left-16 -top-24 h-64 w-64 rounded-full border-[36px] border-white/5" />
          <p className="relative text-sm font-black text-[#f5d38b]">ضاديوم • بيت العربية الرقمي</p>
          <h1 className="relative mt-3 font-arabic-display text-3xl font-black sm:text-5xl">ضاديوم معك</h1>
          <p className="relative mt-3 font-arabic-reading text-lg font-black text-[#f4d48b]">صوتك يُسمَع، ورأيك يصنع الفرق</p>
          <p className="relative mt-4 max-w-3xl font-arabic-reading text-lg leading-9 text-[#e4eee9]">
            عندك سؤال، مشكلة، ملاحظة على أحد الدروس، أو فكرة تجعل ضاديوم أفضل؟
            اكتب لنا مباشرة؛ نريد أن يسمع فريقنا صوت الطالب والمعلم وولي الأمر والمدرسة.
          </p>
        </header>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-[#ddcfb4] bg-[#fffdf8] p-6">
              <h2 className="font-arabic-display text-2xl font-black text-[#123f39]">كيف نقدر نساعدك؟</h2>
              <div className="mt-5 space-y-5">
                {help.map(item => (
                  <div key={item.title}>
                    <h3 className="font-black text-[#174f47]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-[#625b51]">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
            {email || whatsapp ? (
              <section className="rounded-2xl border border-[#ddcfb4] bg-white p-6">
                <h2 className="text-xl font-black text-[#123f39]">قنوات التواصل الرسمية</h2>
                <div className="mt-3 flex flex-col gap-3 text-sm font-bold text-[#174f47]">
                  {email ? <a href={"mailto:" + email} className="break-all underline" dir="ltr">{email}</a> : null}
                  {whatsapp ? (
                    <a href={"https://wa.me/" + whatsapp} target="_blank" rel="noopener noreferrer" className="underline">
                      واتساب ضاديوم: <span dir="ltr" className="inline-block">+973 38921189</span>
                    </a>
                  ) : null}
                </div>
                <div className="mt-5 rounded-xl border border-[#e1d4ba] bg-[#f7f1e6] p-4 text-sm text-[#475c50]">
                  <p className="font-black text-[#123f39]">ساعات التواصل</p>
                  <p className="mt-1">من 6:00 صباحًا إلى 6:00 مساءً بتوقيت البحرين (UTC+3).</p>
                  <p className="mt-2 text-xs leading-6 text-[#6a6256]">
                    يمكنك إرسال البلاغ من النموذج في أي وقت، وستُراجع الرسائل وفق أوقات التواصل المتاحة.
                  </p>
                </div>
              </section>
            ) : null}
            <p className="px-2 text-xs leading-6 text-[#776d5f]">
              تُستقبل رسائل النموذج داخل المنصة للمراجعة من الإدارة. مواعيد التواصل
              المعلنة لا تعني ضمان الرد فورًا، ويمكن تقديم البلاغ في أي وقت.
            </p>
          </aside>
          <ContactForm />
        </div>
        <MyCareRequests />
        <footer className="mt-9 flex flex-wrap gap-5 border-t border-[#d6c6a6] pt-6 text-sm font-bold text-[#174f47]">
          <Link href="/about" className="hover:underline">عن ضاديوم</Link>
          <Link href="/privacy" className="hover:underline">سياسة الخصوصية</Link>
          <Link href="/terms" className="hover:underline">الشروط والأحكام</Link>
          <Link href="/" className="mr-auto hover:underline">العودة إلى الرئيسية</Link>
        </footer>
      </div>
    </main>
  );
}
