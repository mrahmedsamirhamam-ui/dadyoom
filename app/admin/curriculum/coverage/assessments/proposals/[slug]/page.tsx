import Link from "next/link";
import { notFound } from "next/navigation";
import subjectPredicate from "@/data/lesson-game-proposals/bh-grade7-subject-predicate-25-original-2026.json";
import presentBuilding from "@/data/lesson-game-proposals/bh-grade7-present-verb-building-25-original-2026.json";
import listeningDream from "@/data/lesson-game-proposals/bh-grade6-listening-dream-25-original-2026.json";
import pronouns from "@/data/lesson-game-proposals/bh-grade7-pronouns-25-original-2026.json";
import demonstratives from "@/data/lesson-game-proposals/bh-grade7-demonstratives-25-original-2026.json";
import pastTense from "@/data/lesson-game-proposals/bh-grade7-past-verb-building-25-original-2026.json";
import definiteness from "@/data/lesson-game-proposals/bh-grade7-definiteness-25-original-2026.json";
import hamza from "@/data/lesson-game-proposals/bh-grade4-final-hamza-after-damma-25-original-2026.json";
import dad from "@/data/lesson-game-proposals/bh-grade4-letter-dad-25-original-2026.json";
import country from "@/data/lesson-game-proposals/bh-grade4-listening-love-of-country-25-original-2026.json";
import friends from "@/data/lesson-game-proposals/bh-grade5-listening-three-friends-25-original-2026.json";
import dove from "@/data/lesson-game-proposals/bh-grade4-listening-white-dove-25-original-2026.json";
import dream from "@/data/lesson-game-proposals/bh-grade4-listening-dream-achieved-25-original-2026.json";
import scientist from "@/data/lesson-game-proposals/bh-grade4-listening-scientist-mind-25-original-2026.json";
import konar from "@/data/lesson-game-proposals/bh-grade4-listening-konar-tree-25-original-2026.json";
import ApproveProposalButton from "../bahrain-grade4-verbs/ApproveProposalButton";

const proposals = {
  "bh-grade7-subject-predicate": subjectPredicate,
  "bh-grade7-present-verb-building": presentBuilding,
  "bh-grade6-listening-dream": listeningDream,
  "bh-grade7-pronouns": pronouns,
  "bh-grade7-demonstratives": demonstratives,
  "bh-grade7-past-verb-building": pastTense,
  "bh-grade7-definiteness": definiteness,
  "bh-grade4-final-hamza": hamza,
  "bh-grade4-letter-dad": dad,
  "bh-grade4-listening-love-of-country": country,
  "bh-grade5-listening-three-friends": friends,
  "bh-grade4-listening-white-dove": dove,
  "bh-grade4-listening-dream-achieved": dream,
  "bh-grade4-listening-scientist-mind": scientist,
  "bh-grade4-listening-konar-tree": konar,
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
  const teachingPlan = "teachingPlan" in proposal ? proposal.teachingPlan : null;

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
        {teachingPlan && (
          <section className="rounded-3xl border border-[#c8d8c8] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-[#123f39]">سيناريو تدريس مقترح — لمراجعة المعلم</h2>
              <span className="text-sm font-bold text-[#876b30]">{teachingPlan.durationMinutes} دقيقة</span>
            </div>
            <p className="mt-3 text-sm leading-8">{teachingPlan.miniLesson}</p>
            <h3 className="mt-6 text-lg font-black">الأهداف والتقويم</h3>
            <ol className="mt-3 list-inside list-decimal space-y-3 text-sm leading-7">
              {teachingPlan.learningObjectives.map((item) => (
                <li key={item.objective}>
                  <span className="font-bold">{item.objective}</span>
                  <span className="block pr-5 text-[#665b48]">مؤشر التقويم: {item.assessment}</span>
                </li>
              ))}
            </ol>
            <h3 className="mt-6 text-lg font-black">تسلسل الحصة</h3>
            <ol className="mt-3 space-y-3">
              {teachingPlan.lessonFlow.map((stage) => (
                <li key={stage.name} className="rounded-xl bg-[#f7f1e6] px-4 py-3 text-sm leading-7">
                  <strong>{stage.name} — {stage.minutes} دقائق</strong>
                  <p>{stage.activity}</p>
                </li>
              ))}
            </ol>
            <h3 className="mt-6 text-lg font-black">الفروق الفردية</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3 text-sm leading-7">
              <p className="rounded-xl bg-[#f5f9f2] p-4"><strong>الدعم:</strong> {teachingPlan.differentiation.support}</p>
              <p className="rounded-xl bg-[#f5f9f2] p-4"><strong>الأساس:</strong> {teachingPlan.differentiation.core}</p>
              <p className="rounded-xl bg-[#f5f9f2] p-4"><strong>الإثراء:</strong> {teachingPlan.differentiation.challenge}</p>
            </div>
            <h3 className="mt-6 text-lg font-black">بطاقة الخروج</h3>
            <p className="mt-2 leading-8">{teachingPlan.exitTicket.prompt}</p>
            <p className="text-sm leading-7 text-[#645e50]">إجابة مقترحة: {teachingPlan.exitTicket.expected}</p>
            <p className="text-sm leading-7 text-[#645e50]">معيار الإتقان: {teachingPlan.exitTicket.masteryRule}</p>
            <p className="mt-4 text-sm font-bold text-[#8b5f24]">{teachingPlan.teacherReviewNote}</p>
          </section>
        )}
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
