import Link from "next/link";
import { notFound } from "next/navigation";
import hamza from "@/data/lesson-game-proposals/bh-grade4-final-hamza-after-damma-25-original-2026.json";
import dad from "@/data/lesson-game-proposals/bh-grade4-letter-dad-25-original-2026.json";
import country from "@/data/lesson-game-proposals/bh-grade4-listening-love-of-country-25-original-2026.json";
import friends from "@/data/lesson-game-proposals/bh-grade5-listening-three-friends-25-original-2026.json";
import ApproveProposalButton from "../bahrain-grade4-verbs/ApproveProposalButton";

const proposals = {
  "bh-grade4-final-hamza": hamza,
  "bh-grade4-letter-dad": dad,
  "bh-grade4-listening-love-of-country": country,
  "bh-grade5-listening-three-friends": friends,
} as const;

const gameNames: Record<string, string> = {
  maze: "حارس العربية", defender: "حماة القلعة", catcher: "سباق السيارات",
  runner: "عدّاء الكلمات", guardian: "إنقاذ الكنز",
};

export default async function BahrainOriginalGameProposal({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = proposals[slug as keyof typeof proposals];
  if (!proposal) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#203a34]">
      <div className="mx-auto max-w-5xl space-y-6">
        <nav className="flex flex-wrap gap-3 text-sm font-bold text-[#174f47]">
          <Link href="/admin">الإدارة</Link><span>←</span>
          <Link href="/admin/curriculum/coverage/assessments">تدقيق أنشطة البحرين</Link>
          <span>←</span><span>مقترح ألعاب للمراجعة</span>
        </nav>
        <header className="rounded-3xl border border-amber-300 bg-white p-6 sm:p-8">
          <p className="font-black text-amber-900">
            مقترح أسئلة أصلي من ضاديوم — ينتظر مراجعة المعلم
          </p>
          <h1 className="mt-3 text-3xl font-black">{proposal.title} — 25 سؤالًا</h1>
          <p className="mt-4 leading-8">
            الصف {proposal.grade}، الفصل {proposal.semester}، البحرين.
            هذه تدريبات عربية أصلية من ضاديوم مرتبطة بسياق الدرس الداعم،
            وليست من نص الكتاب أو التسجيل الصوتي الوزاري.
            ورد عنوان الدرس في مرجع خطة {proposal.importedPlanReferenceYear}،
            لكن ذلك لا يثبت مطابقة أسئلة هذه الحزمة لفهرس أو نص الكتاب الرسمي.
          </p>
          <p className="mt-2 text-sm font-bold text-amber-900">
            يجب مراجعة كل سؤال وإجابة وتفسير على حدة قبل الضغط على زر الاعتماد.
            فتح هذه الصفحة لا ينشر أي شيء للطلاب.
          </p>
          <Link href={`/admin/lessons/${proposal.lessonId}`} prefetch={false}
            className="mt-4 inline-flex rounded-xl bg-[#174f47] px-5 py-3 text-sm font-black text-white">
            افتح الدرس المصدر وسجلاته ←
          </Link>
        </header>
        {Object.entries(proposal.pack).map(([mode, questions]) => (
          <section key={mode} className="rounded-3xl border border-[#dfd0b1] bg-white p-6">
            <h2 className="text-xl font-black text-[#123f39]">
              {gameNames[mode] ?? mode} — {questions.length} أسئلة
            </h2>
            <ol className="mt-4 space-y-3">
              {questions.map((question, index) => (
                <li key={question.prompt} className="rounded-xl border border-[#e5dbc9] bg-[#fffdf8] p-4">
                  <p className="font-black leading-8">{index + 1}. {question.prompt}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {question.options.map(option => (
                      <li key={option} className={option === question.answer ? "font-black text-emerald-900" : ""}>
                        {option}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-black text-[#123f39]">الإجابة المقترحة: {question.answer}</p>
                  <p className="mt-1 text-sm leading-7 text-[#645e50]">التفسير: {question.explanation}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
        <ApproveProposalButton lessonId={proposal.lessonId} pack={proposal.pack} />
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">
          لا يُعتمد المقترح تلقائيًا؛ النشر يتطلب قرارًا بشريًا صريحًا
          وجلسة مدير منصة مخوّلة، ولا يمنح اعتمادًا وزاريًا.
        </p>
      </div>
    </main>
  );
}
