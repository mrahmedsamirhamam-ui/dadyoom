/** Original, unverified enrichment sample: not a ministry curriculum record. */
export type AdaptivePath = "start" | "progress" | "challenge";
export type ErrorKind = "identify" | "owner" | "case" | "distinction";
export type ChoiceQuestion = {
  id: string;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
  explanation: string;
  errorKind: ErrorKind;
};
export type LearningPath = {
  id: AdaptivePath;
  label: string;
  heading: string;
  method: string;
  presentation: string;
  examples: readonly string[];
  hints: readonly string[];
  practice: readonly ChoiceQuestion[];
};
export const COMMON_GOAL = "يستخرج الطالب الحال المفردة وصاحبها من جمل فعلية جديدة، ويميّز الحال من النعت، ويضبط الحال بالفتحة بدقة 80% على الأقل.";
export const MASTERY_THRESHOLD = 0.8;
export const DIAGNOSTIC: readonly ChoiceQuestion[] = [
  { id:"d1", prompt:"دخلت الطالبة فرحةً. ما الحال؟",options:["دخلت","الطالبة","فرحةً"],correctIndex:2,errorKind:"identify",explanation:"فرحةً تبيّن هيئة الطالبة أثناء الدخول." },
  { id:"d2", prompt:"عاد الطفل سعيدًا. من صاحب الحال؟",options:["الطفل","سعيدًا","عاد"],correctIndex:0,errorKind:"owner",explanation:"الطفل هو الذي عاد في هيئة السعادة." },
  { id:"d3", prompt:"ما السؤال الذي نستخدمه لاكتشاف الحال؟",options:["أين؟","كيف؟","متى؟"],correctIndex:1,errorKind:"identify",explanation:"نسأل: كيف حدث الفعل؟" },
  { id:"d4", prompt:"دخل الضيف ... اختر الحال الصحيح.",options:["هادئٌ","هادئًا","الهادئُ"],correctIndex:1,errorKind:"case",explanation:"الحال المفردة هنا نكرة منصوبة بالفتحة." },
];
export const ANCHOR_ASSESSMENT: readonly ChoiceQuestion[] = [
  { id:"a1",prompt:"وقف الحارس منتبهًا. ما الحال؟",options:["الحارس","وقف","منتبهًا"],correctIndex:2,errorKind:"identify",explanation:"منتبهًا تبين هيئة الحارس وقت الوقوف." },
  { id:"a2",prompt:"عادت السائحة مسرورةً. من صاحب الحال؟",options:["السائحة","مسرورةً","عادت"],correctIndex:0,errorKind:"owner",explanation:"السائحة هي التي اتصفت بالسرور." },
  { id:"a3",prompt:"دخل المدير ... اختر الحال المضبوط.",options:["هادئٌ","هادئًا","الهادئُ"],correctIndex:1,errorKind:"case",explanation:"هادئًا حال منصوبة بالفتحة." },
  { id:"a4",prompt:"استيقظ الطفل نشيطًا. ما السؤال الذي تجيب عنه الحال؟",options:["متى استيقظ؟","أين استيقظ؟","كيف استيقظ؟"],correctIndex:2,errorKind:"identify",explanation:"الحال تجيب عن هيئة صاحبها وقت وقوع الفعل." },
  { id:"a5",prompt:"جاء الرجل الكريمُ. ما إعراب الكريمُ؟",options:["حال","نعت","مفعول به"],correctIndex:1,errorKind:"distinction",explanation:"الكريمُ نعت مرفوع يتبع الرجل في التعريف والرفع." },
];
export const PATHS: Record<AdaptivePath, LearningPath> = {
  start: {
    id:"start",label:"مسار البداية",heading:"أبني الفهم",method:"ألاحظ ← أحل مع ضاد ← أحاول وحدي",
    presentation:"دخلَ الطالبُ مسرورًا. نسأل: كيف دخل الطالب؟ مسرورًا. هذه حال، وصاحبها الطالبُ. الحال المفردة هنا منصوبة بالفتحة.",
    examples:["خرجَ الطفلُ مسرعًا. كيف خرج؟ مسرعًا.","وقفتِ المعلمةُ مبتسمةً. كيف وقفت؟ مبتسمةً."],
    hints:["اسأل عن هيئة صاحب الفعل: كيف؟","ابحث عن الكلمة التي تخبرك كيف جرى الفعل.","مثال مشابه: عادَ الضيفُ سعيدًا؛ سعيدًا هي الحال."],
    practice:[
      {id:"s1",prompt:"عاد المسافر متعبًا. ما الحال؟",options:["عاد","المسافر","متعبًا"],correctIndex:2,errorKind:"identify",explanation:"متعبًا تشرح هيئة المسافر عند عودته."},
      {id:"s2",prompt:"وصلت الأم سعيدةً. من صاحب الحال؟",options:["وصلت","الأم","سعيدةً"],correctIndex:1,errorKind:"owner",explanation:"الأم هي التي اتصفت بالسعادة."},
      {id:"s3",prompt:"خرج الطفل ... اختر الحال الصحيح.",options:["فرحٌ","فرحًا","الفرحُ"],correctIndex:1,errorKind:"case",explanation:"فرحًا حال نكرة منصوبة."},
    ],
  },
  progress: {
    id:"progress",label:"مسار التقدم",heading:"أطبّق وأربط",method:"أراجع ← أقارن ← أطبّق",
    presentation:"دخل الرجلُ مسرورًا: مسرورًا حال تصف الهيئة وقت الدخول. جاء الرجلُ المسرورُ: المسرورُ نعت يتبع الرجل. لاحظ الفرق بين النكرة المنصوبة والنعت المتبع.",
    examples:["عاد اللاعبُ سعيدًا: سعيدًا حال.","اللاعبُ السعيدُ محبوبٌ: السعيدُ نعت."],
    hints:["قارن بين وصف الاسم وهيئته وقت الفعل.","هل الكلمة تتبع الاسم في التعريف والإعراب؟","مثال مشابه: دخل المعلمُ ضاحكًا؛ ضاحكًا حال."],
    practice:[
      {id:"p1",prompt:"وصل المسافر متعبًا. ما نوع متعبًا؟",options:["نعت","حال","فاعل"],correctIndex:1,errorKind:"distinction",explanation:"متعبًا حال؛ لأنها تصف هيئة المسافر عند الوصول."},
      {id:"p2",prompt:"أي جملة تتضمن حالًا مضبوطة؟",options:["عاد الولدُ فرحٌ","عاد الولدُ فرحًا","عاد الولدُ الفرحُ"],correctIndex:1,errorKind:"case",explanation:"فرحًا نكرة منصوبة تبيّن الهيئة."},
      {id:"p3",prompt:"وقف الحارس منتبهًا. ما صاحب الحال؟",options:["منتبهًا","الحارس","وقف"],correctIndex:1,errorKind:"owner",explanation:"الحارس هو من اتصف بالانتباه."},
    ],
  },
  challenge: {
    id:"challenge",label:"مسار التحدي",heading:"أحلّل وأبدع",method:"أكتشف ← أعلّل ← أكتب",
    presentation:"قارن بين «دخل الرجلُ المسرورُ» و«دخل الرجلُ مسرورًا». لماذا تغير إعراب الكلمة ووظيفتها؟ استكشف أولًا، والشرح متاح عند الطلب.",
    examples:["خرج الطبيبُ مسرعًا، ووصل المريضُ متعبًا. حدّد الحال وصاحبها.","اكتب جملتين عن زيارة مكتبة مستخدمًا حالين مفردتين."],
    hints:["ما الفرق بين وصف ثابت للاسم وهيئته وقت الفعل؟","انظر إلى التعريف والتنكير والعلامة الإعرابية.","مثال مشابه: حضر الضيفُ مبتسمًا، فمبتسمًا حال منصوبة."],
    practice:[
      {id:"c1",prompt:"«جاء الرجل الكريمُ»؛ ما وظيفة الكريمُ؟",options:["حال","نعت","مفعول به"],correctIndex:1,errorKind:"distinction",explanation:"الكريمُ نعت يتبع الرجل في التعريف والرفع."},
      {id:"c2",prompt:"«خرج الطبيبُ مسرعًا». لماذا نصبت مسرعًا؟",options:["لأنها حال","لأنها فاعل","لأنها نعت مرفوع"],correctIndex:0,errorKind:"case",explanation:"هي حال مفردة نكرة منصوبة تصف الهيئة أثناء الخروج."},
      {id:"c3",prompt:"أي تركيب يبيّن هيئة الطالبة وقت الدخول؟",options:["دخلت الطالبةُ الهادئةُ","دخلت الطالبةُ هادئةً","الطالبة الهادئة مجتهدة"],correctIndex:1,errorKind:"distinction",explanation:"هادئةً حال تصف هيئة الطالبة وقت الدخول."},
    ],
  },
};
export const PATH_ORDER: readonly AdaptivePath[] = ["start","progress","challenge"];
export function scoreChoices(items: readonly ChoiceQuestion[], answers: Readonly<Record<string,number>>) {
  const answered = items.filter((item)=>Number.isInteger(answers[item.id])).length;
  const correct = items.filter((item)=>answers[item.id]===item.correctIndex).length;
  return { answered, correct, total: items.length, percentage:items.length ? Math.round(correct/items.length*100) : 0, passed:answered===items.length && correct/items.length>=MASTERY_THRESHOLD };
}
export function recommendPath(answers: Readonly<Record<string,number>>, hintsUsed = 0, elapsedMs?: number) {
  const score = scoreChoices(DIAGNOSTIC,answers);
  const errors = DIAGNOSTIC.filter((q)=>answers[q.id]!==q.correctIndex).map((q)=>q.errorKind);
  const route:AdaptivePath = score.correct===4 && hintsUsed===0 ? "challenge" : score.correct>=2 ? "progress" : "start";
  // Time is an observable support signal, never a penalty or diagnostic of intelligence.
  const pace = elapsedMs===undefined ? "غير مقاس" : elapsedMs<=0 ? "غير مقاس" : "مقاس محليًا";
  return {path:route,score:score.correct,total:score.total,errorKinds:[...new Set(errors)],pace};
}
export function suggestChange(current:AdaptivePath, consecutiveCorrect:number, consecutiveErrors:number) {
  const idx=PATH_ORDER.indexOf(current);
  if(consecutiveErrors>=3 && idx>0) return PATH_ORDER[idx-1];
  if(consecutiveErrors>=2 && idx===0) return "start"; // provide an alternative explanation, not a label.
  if(consecutiveCorrect>=2 && idx<2) return PATH_ORDER[idx+1];
  return current;
}
