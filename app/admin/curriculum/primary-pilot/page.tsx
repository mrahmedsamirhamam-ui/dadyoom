import "server-only";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedLessonReviewer } from "@/lib/lesson-review/authorization";
import PrimaryPilotBoard from "./PrimaryPilotBoard";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BahrainPrimaryPilotPage() {
  if (!(await getVerifiedLessonReviewer())) redirect("/admin");
  return <main dir="rtl" className="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <Link href="/admin/quality" className="inline-block font-bold underline">
      العودة إلى مراجعة جودة الدروس الستة
    </Link>
    <h1 className="text-3xl font-black text-[#174f47]">
      ضاديوم — مراجعة مناهج البحرين للصفوف الأول والثاني والثالث
    </h1>
    <p className="leading-8">
      ثلاث قوائم عمل للأدلة الأربعة. تستخدم هذه الصفحة ملف جرد محليًا ولا تُصدر
      اعتمادًا وزاريًا أو تغيّر نشر الدروس دون تنفيذ مراجع مخوّل في staging.
    </p>
    <PrimaryPilotBoard />
  </main>;
}
