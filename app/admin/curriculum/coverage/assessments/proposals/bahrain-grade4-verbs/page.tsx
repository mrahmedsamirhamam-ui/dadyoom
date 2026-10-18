import Link from "next/link";
import proposal from "@/data/lesson-game-proposals/bh-grade4-types-of-verbs-25-original-2026.json";
import ApproveProposalButton from "./ApproveProposalButton";

const modeNames: Record<string, string> = {
  maze: "حارس العربية",
  defender: "حماة القلعة",
  catcher: "سباق السيارات",
  runner: "عدّاء الكلمات",
  guardian: "إنقاذ الكنز",
};

export default function BahrainGradeFourVerbsProposalPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-9 text-[#203a34]">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
          <Link href="/admin">الإدارة</Link>
          <span>←</span>
          <Link href="/admin/curriculum/coverage/assessments">مراجعة أنشطة البحرين</Link>
          <span>←</span>
          <span>اقتراح الألعاب: أنواع الفعل</span>
        </nav>
        <header className="rounded-3xl border border-amber-300 bg-white p-6 sm:p-9">
          <p className="font-black text-amber-800">مقترح تعليمي من تأليف ضاديوم • ينتظر اعتماد المعلّم</p>
          <h1 className="mt-3 text-3xl font-black text-[#123f39]">
            {proposal.title} — 25 سؤالًا للألعاب الخمس
          </h1>
          <p className="mt-4 leading-8">
            درس الصف الرابع في البحرين، الفصل الثاني. هذه أسئلة عربية أصلية،
            وليست من كتاب الوزارة. عنوان الدرس مسجل في خطة أقدم لعام {proposal.importedPlanReferenceYear}،
            ولم تثبت مطابقته لفهرس الكتب الرسمية 2026–2027.
          </p>
          <p className="mt-2 text-sm font-bold text-amber-900">
            لا يتم نشر هذه الأسئلة للطالب تلقائيًا أو وصفها بأنها معتمدة.
            اعرض الإجابات والأسباب على معلّم متخصص قبل اعتمادها.
          </p>
          <Link
            href={`/admin/lessons/${proposal.lessonId}`}
            className="mt-5 inline-flex rounded-xl bg-[#174f47] px-5 py-3 font-black text-white"
          >
            افتح الدرس الأصلي وسياقه ←
          </Link>
        </header>
        {Object.entries(proposal.pack).map(([mode, questions]) => (
          <section key={mode} className="rounded-3xl border border-[#dacba9] bg-white p-6">
            <h2 className="text-xl font-black text-[#123f39]">
              {modeNames[mode] ?? mode} — {questions.length} أسئلة
            </h2>
            <ol className="mt-4 space-y-5">
              {questions.map((question, index) => (
                <li key={question.prompt} className="rounded-xl border border-[#e8dfc9] bg-[#fffdf7] p-4">
                  <p className="font-black leading-8">{index + 1}. {question.prompt}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {question.options.map(option => (
                      <li key={option} className={option === question.answer ? "font-bold text-emerald-900" : ""}>
                        {option}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-bold text-[#123f39]">الإجابة المقترحة: {question.answer}</p>
                  <p className="mt-1 text-sm leading-7 text-[#635d52]">التفسير: {question.explanation}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <ApproveProposalButton lessonId={proposal.lessonId} pack={proposal.pack} />
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">
          حالة المقترح قبل الاعتماد: مراجعة تربوية مطلوبة.
          لا يغيّر عرض الصفحة حالة الاعتماد. النشر لا يتم إلا بعد تأكيد بشري
          والتحقق الخادمي من صلاحية مدير المنصة وصحة بنية 25 سؤالًا.
        </p>
      </div>
    </main>
  );
}
