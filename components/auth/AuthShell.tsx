import type { ReactNode } from "react";
import DadyoomLogo from "@/components/brand/DadyoomLogo";

export default function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f8f0df] px-4 py-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-[#fffef9] shadow-2xl shadow-[#174f47]/10 ring-1 ring-[#ddcfb3] lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden bg-[#174f47] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div aria-hidden="true" className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #f5cf7a 0 2px, transparent 2.5px)", backgroundSize: "32px 32px" }} />
          <div className="relative">
            <DadyoomLogo inverse />
            <h2 className="mt-16 font-arabic-display text-4xl font-black leading-tight">
              العربية تصل إلى القلب
              <span className="block text-[#f5cf7a]">ثم تفتح أبواب المعرفة</span>
            </h2>
            <p className="mt-5 max-w-md leading-8 text-[#e8f2ed]">
              تعلّم من منهجك، نمِّ مهاراتك الأربع، واسأل ضاد عندما تحتاج إلى شرح أو تدريب.
            </p>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="font-black">تجربة عربية من البداية</div>
            <p className="mt-2 text-sm leading-7 text-[#e8f2ed]">
              طالب، معلم، ولي أمر أو مدرسة — لكل حساب رحلة واضحة ومحتوى يناسب دوره.
            </p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="w-full">
            <div className="lg:hidden"><DadyoomLogo /></div>
            <h1 className="mt-7 font-arabic-display text-3xl font-black text-[#27231f]">{title}</h1>
            <p className="mt-2 text-sm leading-7 text-[#746b60]">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
