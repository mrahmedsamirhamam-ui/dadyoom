import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import TeacherDashboardPanel from "./TeacherDashboardPanel";

/**
 * Keep the initial teacher portal responsive while its RLS-scoped class,
 * roster, lesson, and school-link requests complete. The original panel
 * remains server-side: this is NOT a public cache or authorization bypass.
 */
export default async function TeacherPage() {
  const { user, userError: authError } = await getDashboardRequestViewer();
  if (authError || !user) {
    redirect(
      "/login"
    );
  }

  return (
    <Suspense fallback={<TeacherDashboardFallback />}>
      <TeacherDashboardPanel />
    </Suspense>
  );
}

function TeacherDashboardFallback() {
  const actions = [
    { href: "/teacher/studio", label: "استوديو المعلم", description: "حضّر درسًا واختبارًا" },
    { href: "/teacher/marketplace", label: "الدورات التعليمية", description: "أدر دوراتك ودروسك" },
    { href: "/teacher/live", label: "الحصص المباشرة", description: "افتح غرفة تعليمية" },
    { href: "/courses", label: "مناهج اللغة العربية", description: "تصفّح المحتوى التعليمي" },
  ];
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-3xl bg-gradient-to-l from-emerald-700 to-teal-600 p-7 text-white">
          <p className="text-sm font-black text-emerald-100">لوحة المعلم</p>
          <h1 className="mt-2 text-3xl font-black">أدوات المعلم جاهزة</h1>
          <p role="status" aria-live="polite" className="mt-3 leading-8">
            جارٍ تحميل الفصول والطلاب ودروسك من حسابك بأمان. يمكنك استخدام الأدوات التعليمية الآن.
          </p>
        </section>
        <nav aria-label="روابط المعلم أثناء تحميل بيانات الفصول"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(action => (
            <Link key={action.href} href={action.href} prefetch={false}
              className="rounded-2xl border border-emerald-100 bg-white p-5 hover:border-emerald-300">
              <span className="font-black text-[#123f39]">{action.label}</span>
              <p className="mt-2 text-sm text-slate-600">{action.description}</p>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
