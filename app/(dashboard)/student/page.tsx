import Link from "next/link";

const skills = [
  { title: "القراءة", icon: "📖", progress: 72, href: "/courses" },
  { title: "الكتابة", icon: "✍️", progress: 58, href: "/courses" },
  { title: "الاستماع", icon: "🎧", progress: 64, href: "/courses" },
  { title: "التحدث", icon: "🎙️", progress: 46, href: "/courses" },
];

const activities = [
  { title: "أكمل درس الفهم القرائي", meta: "12 دقيقة", icon: "📚" },
  { title: "تدرّب على الهمزة المتوسطة", meta: "8 دقائق", icon: "✏️" },
  { title: "اختبار مفردات قصير", meta: "5 دقائق", icon: "🎯" },
];

export default function StudentPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-teal-700 via-teal-600 to-emerald-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-teal-100">لوحة الطالب</p>
              <h1 className="text-3xl font-black sm:text-4xl">مرحبًا بك في ضاديوم 👋</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-teal-50 sm:text-base">
                أكمل رحلتك في العربية خطوة بخطوة، وراقب تقدمك، واسأل ضاد عندما تحتاج إلى المساعدة.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/courses" className="rounded-xl bg-white px-5 py-3 font-bold text-teal-700 shadow-sm transition hover:-translate-y-0.5">
                  أكمل آخر درس
                </Link>
                <Link href="/ask" className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20">
                  اسأل ضاد
                </Link>
              </div>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3">
              <Stat label="النقاط" value="1,240" icon="🏆" />
              <Stat label="السلسلة" value="7 أيام" icon="🔥" />
              <Stat label="الدروس" value="18" icon="📘" />
              <Stat label="المستوى" value="متوسط" icon="⭐" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">تقدمك في المهارات</h2>
                <p className="mt-1 text-sm text-slate-500">تابع تطورك في المهارات الأربع</p>
              </div>
              <Link href="/courses" className="text-sm font-bold text-teal-700 hover:underline">
                عرض الكل
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {skills.map((skill) => (
                <Link key={skill.title} href={skill.href} className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{skill.icon}</span>
                    <span className="text-sm font-bold text-teal-700">{skill.progress}%</span>
                  </div>
                  <h3 className="mt-3 font-black text-slate-900">{skill.title}</h3>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${skill.progress}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-xl font-black text-slate-900">هدف الأسبوع</h2>
            <p className="mt-1 text-sm text-slate-500">أكمل 5 دروس هذا الأسبوع</p>

            <div className="mt-6 flex items-center justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-teal-50 ring-[12px] ring-teal-600">
                <div className="text-center">
                  <div className="text-4xl font-black text-teal-700">3/5</div>
                  <div className="mt-1 text-sm font-bold text-slate-500">دروس مكتملة</div>
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-amber-50 p-4 text-amber-900">
              <div className="font-black">استمر! 🔥</div>
              <p className="mt-1 text-sm leading-6">بقي درسان فقط لتحقق هدفك الأسبوعي.</p>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-900">مقترح لك اليوم</h2>
              <p className="mt-1 text-sm text-slate-500">أنشطة قصيرة تناسب تقدمك الحالي</p>
            </div>

            <div className="space-y-3">
              {activities.map((activity) => (
                <Link key={activity.title} href="/courses" className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">
                    {activity.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-black text-slate-900">{activity.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{activity.meta}</p>
                  </div>
                  <span className="text-xl text-slate-400">←</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-sm">
            <div className="text-5xl">🤖</div>
            <h2 className="mt-4 text-2xl font-black">ضاد معك دائمًا</h2>
            <p className="mt-3 text-sm leading-7 text-indigo-50">
              اسأل عن معنى كلمة، قاعدة نحوية، أو اطلب تدريبًا يناسب مستواك.
            </p>
            <Link href="/ask" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-black text-indigo-700 transition hover:-translate-y-0.5">
              ابدأ المحادثة
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 text-xl font-black">{value}</div>
      <div className="mt-1 text-xs font-semibold text-teal-100">{label}</div>
    </div>
  );
}
