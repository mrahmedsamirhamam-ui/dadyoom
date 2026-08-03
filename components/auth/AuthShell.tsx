import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-200 lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl font-black ring-1 ring-white/20">
                ض
              </div>
              <div>
                <div className="text-2xl font-black">ضاديوم</div>
                <div className="text-sm text-teal-100">بيت العربية الرقمي</div>
              </div>
            </Link>

            <h2 className="mt-16 text-4xl font-black leading-tight">
              العربية تجمعنا
              <span className="block text-amber-300">وتفتح لنا الآفاق</span>
            </h2>

            <p className="mt-5 max-w-md leading-8 text-teal-50">
              سجّل دخولك لمتابعة دروسك، تقدمك، نقاطك، والتواصل مع ضاد.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <div className="font-black">تجربة تعليمية متكاملة</div>
            <p className="mt-2 text-sm leading-6 text-teal-100">
              طالب، معلم، ولي أمر، أو مدرسة — لكل مستخدم مساحة تناسب احتياجاته.
            </p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="w-full">
            <div className="lg:hidden">
              <Link href="/" className="text-xl font-black text-teal-700">
                ضاديوم
              </Link>
            </div>

            <h1 className="mt-6 text-3xl font-black text-slate-950">{title}</h1>
            <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>

            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
