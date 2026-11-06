"use client";

import { useState } from "react";
import { ANCHOR_ASSESSMENT, COMMON_GOAL, DIAGNOSTIC, PATH_ORDER, PATHS, recommendPath, scoreChoices, suggestChange, type AdaptivePath, type ChoiceQuestion } from "@/lib/adaptive-lessons/hal";

type Stage = "diagnostic" | "learning" | "assessment" | "result";
function QuestionSet({ items, answers, onAnswer, disabled = false, reveal = false }: {
  items: readonly ChoiceQuestion[];
  answers: Record<string,number>;
  onAnswer: (id:string, index:number)=>void;
  disabled?: boolean;
  reveal?: boolean;
}) {
  return <div className="space-y-5">{items.map((item,i)=><fieldset key={item.id} className="min-w-0 rounded-2xl border border-[#dfd2b9] bg-white p-4">
    <legend className="px-2 font-bold text-[#173f35]">{i+1}. {item.prompt}</legend>
    <div className="mt-2 grid gap-2">{item.options.map((option,j)=><label key={j} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-[#f8f5ed] px-3 py-2 text-[#263e32]">
      <input type="radio" name={item.id} value={j} checked={answers[item.id]===j} onChange={()=>onAnswer(item.id,j)} disabled={disabled} className="accent-[#174d44]" />
      <span>{option}</span>
    </label>)}</div>
    {reveal ? <p role="status" className={"mt-3 rounded-lg p-2 text-sm font-bold " + (answers[item.id]===item.correctIndex ? "bg-[#e7f4ed] text-[#174d44]" : "bg-[#fff1d5] text-[#604b20]")}>{answers[item.id]===item.correctIndex ? "صحيح. " : "للمراجعة: "}{item.explanation}</p> : null}
  </fieldset>)}</div>;
}
export default function HalAdaptiveLesson() {
  const [stage,setStage] = useState<Stage>("diagnostic");
  const [diagnosticAnswers,setDiagnosticAnswers] = useState<Record<string,number>>({});
  const [path,setPath] = useState<AdaptivePath>("start");
  const [suggested,setSuggested] = useState<AdaptivePath>("start");
  const [practiceAnswers,setPracticeAnswers] = useState<Record<string,number>>({});
  const [practiceChecked,setPracticeChecked] = useState(false);
  const [assessmentAnswers,setAssessmentAnswers] = useState<Record<string,number>>({});
  const [hintsShown,setHintsShown] = useState(0);
  const [practiceMistakes,setPracticeMistakes] = useState(0);
  const [practiceSuccess,setPracticeSuccess] = useState(0);
  const [showExplanation,setShowExplanation] = useState(false);
  const [startedAt] = useState(()=>Date.now());
  const active = PATHS[path];
  const assessmentScore = scoreChoices(ANCHOR_ASSESSMENT,assessmentAnswers);
  const practiceScore = scoreChoices(active.practice,practiceAnswers);
  const resetPath = (next:AdaptivePath)=>{
    setPath(next); setPracticeAnswers({}); setPracticeChecked(false);
    setHintsShown(0);setPracticeMistakes(0);setPracticeSuccess(0);setShowExplanation(false);
  };
  const begin=()=>{
    const proposal=recommendPath(diagnosticAnswers,0,Date.now()-startedAt);
    setSuggested(proposal.path);resetPath(proposal.path);setStage("learning");
  };
  const checkPractice=()=>{
    setPracticeChecked(true);
    if(practiceScore.correct===practiceScore.total){setPracticeSuccess(v=>v+1);setPracticeMistakes(0);}
    else {setPracticeMistakes(v=>v+1);setPracticeSuccess(0);}
  };
  const updatePractice=(id:string,index:number)=>{
    setPracticeAnswers(a=>({...a,[id]:index}));setPracticeChecked(false);
  };
  const suggestion=suggestChange(path,practiceSuccess,practiceMistakes);
  return <section dir="rtl" className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
    <div className="rounded-3xl border border-[#d9c293] bg-[#fffef9] p-5 shadow-sm sm:p-7">
      <p className="text-sm font-bold text-[#946e24]">مختبر تربوي أصلي · الصف السابع · غير مرتبط بمنهج وزاري معتمد</p>
      <h1 className="mt-3 font-arabic-display text-3xl font-black text-[#174d44]">الحال: كيف حدث الفعل؟</h1>
      <p className="mt-3 leading-8 text-[#3d4a46]"><strong>هدفنا المشترك:</strong> {COMMON_GOAL}</p>
      <p className="mt-2 text-sm text-[#665d50]">يمكنك اختيار أي مسار دون تصنيف ثابت. إجابات النموذج لا تُرسَل إلى الخادم ولا تُحفظ في حسابك.</p>
    </div>
    <nav aria-label="خطوات الدرس" className="flex flex-wrap gap-2 text-xs font-bold text-[#174d44]">
      {(["diagnostic","learning","assessment","result"] as const).map((step,i)=><span key={step} aria-current={stage===step ? "step" : undefined} className={"rounded-full px-3 py-2 "+(stage===step?"bg-[#174d44] text-white":"bg-[#ede5d5]")}>{["أكتشف احتياجي","أتعلّم","أتحقق","أراجع"][i]}</span>)}
    </nav>
    {stage==="diagnostic" ? <div className="space-y-4">
      <h2 className="text-xl font-black text-[#173f35]">أجب عن أربعة أسئلة قصيرة</h2>
      <p className="text-[#3d4a46]">التشخيص يساعد ضاد على اقتراح طريقة الشرح، ويمكنك تغييرها.</p>
      <QuestionSet items={DIAGNOSTIC} answers={diagnosticAnswers} onAnswer={(id,index)=>setDiagnosticAnswers(a=>({...a,[id]:index}))}/>
      <button type="button" disabled={scoreChoices(DIAGNOSTIC,diagnosticAnswers).answered!==DIAGNOSTIC.length} onClick={begin} className="w-full rounded-full bg-[#174d44] px-5 py-4 font-bold text-white disabled:opacity-50">ابدأ الدرس</button>
    </div> : null}
    {stage==="learning" ? <div className="space-y-5">
      <div className="rounded-2xl border border-[#d7c391] bg-[#fffef9] p-4">
        <h2 className="font-black text-[#174d44]">اختر طريقة التعلم التي تناسبك</h2>
        <p className="mt-1 text-sm text-[#4f5c55]">اقتراح اليوم: {PATHS[suggested].label} — يمكنك الانتقال في أي وقت.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{PATH_ORDER.map(item=><button key={item} type="button" onClick={()=>resetPath(item)} aria-pressed={path===item} className={"min-h-12 rounded-xl border px-3 py-3 font-bold "+(path===item?"border-[#174d44] bg-[#174d44] text-white":"border-[#d6c7a7] bg-white text-[#174d44]")}>{PATHS[item].label}</button>)}</div>
      </div>
      <article className="space-y-4 rounded-3xl border border-[#e2d4b8] bg-white p-5">
        <h2 className="font-arabic-display text-2xl font-black text-[#174d44]">{active.heading}</h2>
        <p className="font-bold text-[#946e24]">{active.method}</p>
        {path!=="challenge"||showExplanation ? <p className="rounded-2xl bg-[#f7f1e6] p-4 leading-9 text-[#2d423b]">{active.presentation}</p> : <button type="button" onClick={()=>setShowExplanation(true)} className="rounded-full border border-[#c4ab72] px-5 py-3 font-bold text-[#174d44]">أحتاج شرحًا قبل التحدي</button>}
        <ul className="list-inside list-disc space-y-2 leading-8 text-[#344d43]">{active.examples.map(x=><li key={x}>{x}</li>)}</ul>
        {hintsShown>0 ? <p className="rounded-xl bg-[#fff2d9] p-3 text-[#5a4825]">تلميح {hintsShown}: {active.hints[hintsShown-1]}</p> : null}
        <button type="button" onClick={()=>setHintsShown(v=>Math.min(v+1,3))} disabled={hintsShown===3} className="rounded-full border border-[#b9a270] px-4 py-2 text-sm font-bold text-[#174d44] disabled:opacity-50">أريد تلميحًا متدرجًا</button>
      </article>
      <h3 className="text-xl font-black text-[#174d44]">أطبّق بنفسي</h3>
      <QuestionSet items={active.practice} answers={practiceAnswers} onAnswer={updatePractice} reveal={practiceChecked}/>
      <button type="button" disabled={practiceScore.answered!==active.practice.length} onClick={checkPractice} className="w-full rounded-full bg-[#174d44] px-5 py-4 font-bold text-white disabled:opacity-50">تحقق من تدريباتي</button>
      {practiceChecked && <p role="status" className="font-bold text-[#345d50]">الإجابات الصحيحة: {practiceScore.correct} من {practiceScore.total}.</p>}
      {practiceChecked && suggestion!==path ? <button type="button" onClick={()=>resetPath(suggestion)} className="w-full rounded-xl border border-[#d1ab59] bg-[#fff4d9] p-4 font-bold text-[#174d44]">جرّب {PATHS[suggestion].label}؛ هذا اقتراح اختياري</button> : null}
      {practiceChecked && practiceMistakes>=2 && path==="start" ? <p className="rounded-xl bg-[#fff4d9] p-4 text-[#694c1e]">يمكنك الرجوع إلى الأمثلة وطلب شرح بديل من ضاد أو المعلم.</p> : null}
      <button type="button" onClick={()=>{setAssessmentAnswers({});setStage("assessment");}} className="w-full rounded-full border-2 border-[#174d44] bg-white p-4 font-black text-[#174d44]">انتقل للتقييم المشترك</button>
    </div> : null}
    {stage==="assessment" ? <div className="space-y-4">
      <h2 className="text-xl font-black text-[#174d44]">المعيار نفسه لكل المسارات</h2>
      <p className="text-[#3d4a46]">خمسة أسئلة جديدة بلا تلميحات. تحتاج إلى أربع إجابات صحيحة على الأقل.</p>
      <QuestionSet items={ANCHOR_ASSESSMENT} answers={assessmentAnswers} onAnswer={(id,index)=>setAssessmentAnswers(a=>({...a,[id]:index}))}/>
      <button type="button" disabled={assessmentScore.answered!==ANCHOR_ASSESSMENT.length} onClick={()=>setStage("result")} className="w-full rounded-full bg-[#174d44] p-4 font-black text-white disabled:opacity-50">صحح تقييمي</button>
    </div> : null}
    {stage==="result" ? <div className="space-y-4">
      <div role="status" className="rounded-2xl border border-[#d7c391] bg-[#fffef9] p-6 text-center">
        <p className="text-3xl font-black text-[#174d44]">{assessmentScore.correct} / {assessmentScore.total}</p>
        <h2 className="mt-3 text-xl font-black text-[#174d44]">{assessmentScore.passed?"حققت معيار الإتقان الفوري":"نراجع الهدف بخطوات أخرى"}</h2>
        <p className="mt-2 leading-8 text-[#3d4a46]">نوصي بمراجعة جديدة بعد يومين وبعد سبعة أيام، بأسئلة مختلفة ومتكافئة، قبل إثبات الإتقان المستمر.</p>
      </div>
      <QuestionSet items={ANCHOR_ASSESSMENT} answers={assessmentAnswers} onAnswer={()=>{}} disabled reveal/>
      <button type="button" onClick={()=>{setAssessmentAnswers({});setStage("assessment")}} className="w-full rounded-full border border-[#174d44] p-4 font-bold text-[#174d44]">أعِد التقييم</button>
      <button type="button" onClick={()=>{resetPath(path);setStage("learning")}} className="w-full rounded-full bg-[#174d44] p-4 font-bold text-white">راجع الشرح</button>
    </div> : null}
  </section>;
}
