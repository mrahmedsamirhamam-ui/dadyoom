"use client";

import { useState } from "react";

type Task = { instruction: string; check: string };
type Level = "support" | "apply" | "challenge";

const practiceByType: Record<string, Record<Level, Task>> = {
  reading: {
    support: { instruction: "ارجع إلى نص القراءة أو المثال المعروض. اختر جملة تحمل معلومة مباشرة، ثم اكتب ما فهمته منها بكلماتك.", check: "هل ذكرت معلومة وردت فعلًا في النص من غير إضافة أحداث؟" },
    apply: { instruction: "اكتب الفكرة الأساسية في جملة، ثم استشهد بعبارة أو مثال من النص يدعم استنتاجك.", check: "هل الفكرة عامة؟ وهل دليلك موجود في المادة المعروضة؟" },
    challenge: { instruction: "اكتب فقرة قصيرة تميّز بين ما ورد صراحةً وما استنتجته، واقترح عنوانًا بديلًا مبررًا.", check: "هل أوضحت الفرق بين الدليل والتفسير الشخصي؟" },
  },
  grammar: {
    support: { instruction: "أعد قراءة المثال النحوي في الشرح. حدد الكلمة أو التركيب الذي يوضح القاعدة، واكتب اسمه.", check: "هل ربطت الحكم بمثال حقيقي في الشرح؟" },
    apply: { instruction: "كوّن جملة جديدة تطبق القاعدة في هذا الدرس. ميّز الكلمة المستهدفة ثم اشرح سبب ضبطها أو تصنيفها.", check: "هل تطبيقك مطابق لشرح القاعدة وليس مجرد نسخ للمثال؟" },
    challenge: { instruction: "اكتب جملة بها خطأ شائع في القاعدة، ثم صححها وعلل الاختلاف بين الصيغتين.", check: "هل شرحت سبب التصحيح باستخدام القاعدة المذكورة؟" },
  },
  spelling: {
    support: { instruction: "استخرج كلمة من مثال الدرس تبرز الرسم الإملائي المستهدف، واكتبها بوضوح.", check: "هل راجعت شكل الحروف والهمزات وعلامات المد؟" },
    apply: { instruction: "اكتب ثلاث كلمات جديدة تنطبق عليها الظاهرة الإملائية، ثم كوّن جملة بإحداها.", check: "هل راجعت الكلمات على القاعدة المذكورة في الشرح؟" },
    challenge: { instruction: "ابتكر مثالًا صحيحًا وآخر فيه خطأ إملائي متصل بالدرس، ثم بين ما تغير وكيف أصلحته.", check: "هل سبب تصحيحك لغوي وليس تخمينًا؟" },
  },
  listening: {
    support: { instruction: "استمع إلى المادة المتاحة إن كان لها تسجيل، أو اقرأ نص الاستماع الداعم مع المعلم. سجل معلومة سمعتها أو قرأتها.", check: "هل كانت المعلومة موجودة في المصدر المتاح فعلًا؟" },
    apply: { instruction: "لخص مضمون النص المسموع أو الداعم في جملتين، ثم اطرح سؤالًا له إجابة من النص.", check: "هل تلخيصك دقيق وهل إجابة السؤال تستند إلى النص؟" },
    challenge: { instruction: "اشرح ما ورد في النص، ثم قدم استنتاجًا منفصلًا واذكر ما يدعمه من دليل.", check: "هل فرّقت بين المعلومة الصريحة والاستنتاج؟" },
  },
  speaking: {
    support: { instruction: "حضّر جملتين قصيرتين لتتحدث بهما عن موضوع الدرس. اقرأهما بوضوح ثم أعد صياغتهما شفهيًا.", check: "هل كل جملة مفهومة وتخدم الموضوع؟" },
    apply: { instruction: "رتب حديثًا من مقدمة ونقطتين وخاتمة. قدمه لشخص آخر واستخدم لغة مناسبة للموقف.", check: "هل التزمت بتسلسل الأفكار وآداب الحديث؟" },
    challenge: { instruction: "حاور زميلًا حول موضوع الدرس، ثم لخص رأيه باحترام وأعد صياغة نقطة لتصبح أوضح.", check: "هل أنصت جيدًا قبل الرد وقدمت فكرة مدعومة؟" },
  },
  writing: {
    support: { instruction: "اكتب جملتين حول موضوع الدرس، وضع نقطة في نهايتهما وراجع الصياغة.", check: "هل الجملتان واضحتان وخاليتان من الخطأ الأساسي؟" },
    apply: { instruction: "خطط لفقرة متصلة تبدأ بفكرة واضحة، ثم اكتب ثلاثًا إلى خمس جمل تدعمها.", check: "هل الجمل مترابطة وهل استخدمت علامات ترقيم مناسبة؟" },
    challenge: { instruction: "اكتب نصًا قصيرًا يناسب غرض الدرس، ثم راجعه مرتين: مرةً للتراكيب والإملاء ومرةً للوضوح وترتيب الأفكار.", check: "هل تغير النص للأفضل بعد التحرير؟ وما الدليل؟" },
  },
  vocabulary: {
    support: { instruction: "اختر مفردتين معروضتين في الدرس، وانطق كل كلمة ثم اكتب معناها من سياقها.", check: "هل المعنى مناسب لسياق المثال؟" },
    apply: { instruction: "اكتب جملة جديدة لكل مفردة مستهدفة، ثم اشرح لماذا تناسب الكلمة هذا السياق.", check: "هل استعملت الكلمة في معنى صحيح وبناء سليم؟" },
    challenge: { instruction: "قارن بين مفردتين متقاربتين أو مختلفتين في المعنى كما يسمح الدرس، ثم اكتب موقفًا جديدًا يوظفهما.", check: "هل حددت التشابه أو الفرق دون ادعاء ترادف غير دقيق؟" },
  },
  assessment: {
    support: { instruction: "اختر تدريبًا موجودًا في هذا الدرس، أعد حلّه واذكر قاعدة أو دليلًا واحدًا يدعم إجابتك.", check: "هل تأكدت من الإجابة بالرجوع إلى المادة المعروضة؟" },
    apply: { instruction: "حل مثالًا جديدًا على المهارة نفسها دون النظر إلى النموذج ثم قارن خطواتك به.", check: "هل راجعت الطريقة والنتيجة معًا؟" },
    challenge: { instruction: "حدد خطأ واجهته أثناء حل النشاط، وصمّم مثالًا مشابهًا ثم اكتب كيف ستتجنب الخطأ.", check: "هل خطتك للتصحيح واضحة وقابلة للتطبيق؟" },
  },
};

const stageLabels: Record<Level, string> = {
  support: "أفهم بمساعدة",
  apply: "أطبق بنفسي",
  challenge: "أتحدى نفسي",
};

export default function LessonPracticeWorkspace({
  title,
  lessonType,
  objective,
}: {
  title: string;
  lessonType: string | null;
  objective?: string;
}) {
  const [level, setLevel] = useState<Level>("support");
  const [drafts, setDrafts] = useState<Record<Level, string>>({
    support: "", apply: "", challenge: "",
  });
  const [completed, setCompleted] = useState<Record<Level, boolean>>({
    support: false, apply: false, challenge: false,
  });
  const [checkOpen, setCheckOpen] = useState(false);
  const task = (practiceByType[lessonType ?? ""] ?? practiceByType.assessment)[level];
  const progress = Object.values(completed).filter(Boolean).length;
  return (
    <section dir="rtl" aria-labelledby="lesson-practice-workspace-title"
      className="lesson-arabic-card rounded-3xl border border-[#d8c49c] bg-[#fffdf8] p-4 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#a06b21]">التعلّم بالتطبيق — متاح في جميع الدروس ذات المحتوى التعليمي</p>
          <h2 id="lesson-practice-workspace-title" className="mt-2 text-2xl font-black text-[#123f39]">
            مساحة تدريبي: {title}
          </h2>
        </div>
        <span className="rounded-full bg-[#e7f2ec] px-4 py-2 text-sm font-black text-[#195248]">
          {progress} من 3 أنشطة
        </span>
      </div>
      {objective ? <p className="mt-3 text-sm leading-8 text-[#5d675e]">أراجع هدف الدرس: {objective}</p> : null}
      <p className="mt-2 text-xs leading-7 text-[#756a59]">
        هذه مهام مساندة أصلية من ضاديوم مرتبطة بالشرح المعروض، وليست أسئلة الكتاب المدرسي.
        كتابتك تبقى في هذه الصفحة فقط؛ لا تُحفظ في حسابك ولا تُصحح آليًا.
      </p>
      <div role="group" aria-label="مستوى التطبيق" className="mt-5 grid gap-2 sm:grid-cols-3">
        {(["support", "apply", "challenge"] as const).map((key) => (
          <button key={key} type="button" aria-pressed={level === key}
            onClick={() => { setLevel(key); setCheckOpen(false); }}
            className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-black transition focus-visible:outline-2 focus-visible:outline-[#bd8b34] ${
              level === key ? "border-[#16473d] bg-[#16473d] text-white" :
              "border-[#d6c7a9] bg-white text-[#16473d] hover:bg-[#eef4ec]"
            }`}>
            {completed[key] ? "✓ " : ""}{stageLabels[key]}
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-2xl bg-[#f3f0e6] p-4 sm:p-5">
        <h3 className="text-lg font-black text-[#123f39]">{stageLabels[level]}</h3>
        <p className="mt-2 text-base leading-9 text-[#3e5148]">{task.instruction}</p>
        <label htmlFor="lesson-practice-answer" className="mt-4 block text-sm font-black text-[#123f39]">
          أكتب إجابتي أو خطة عملي
        </label>
        <textarea id="lesson-practice-answer" rows={4}
          value={drafts[level]}
          onChange={(event) => {
            setDrafts((old) => ({ ...old, [level]: event.target.value }));
            setCompleted((old) => ({ ...old, [level]: false }));
          }}
          placeholder="أكتب هنا مثالًا من إنشائي أو الدليل الذي استخرجته من الشرح..."
          className="mt-2 w-full min-w-0 rounded-xl border border-[#c6b995] bg-white p-3 text-base leading-8 text-[#183d36] focus-visible:outline-2 focus-visible:outline-[#bd8b34]"
          maxLength={2500}/>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" aria-expanded={checkOpen} onClick={() => setCheckOpen(x => !x)}
            className="min-h-11 rounded-xl border border-[#bca374] bg-white px-4 py-2 text-sm font-black text-[#16473d]">
            {checkOpen ? "إخفاء معيار المراجعة" : "كيف أراجع إجابتي؟"}
          </button>
          <button type="button" disabled={drafts[level].trim().length < 5}
            onClick={() => setCompleted((old) => ({ ...old, [level]: true }))}
            className="min-h-11 rounded-xl bg-[#16473d] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            علّمت النشاط منجزًا
          </button>
          {drafts[level] && (
            <button type="button" onClick={() => {
              setDrafts((old) => ({ ...old, [level]: "" }));
              setCompleted((old) => ({ ...old, [level]: false }));
            }} className="min-h-11 rounded-xl border border-[#cbbda5] px-4 py-2 text-sm font-black text-[#766047]">
              مسح محاولتي
            </button>
          )}
        </div>
        {checkOpen && <p role="note" className="mt-3 rounded-xl border border-[#b2ccb9] bg-white p-4 text-sm leading-8 text-[#295b42]">
          {task.check} هذه مساعدة على التحقق الذاتي وليست تصحيحًا آليًا. راجع الشرح أو اطلب تغذية راجعة من معلمك.
        </p>}
        {completed[level] && <p role="status" className="mt-3 text-sm font-bold text-[#296b49]">
          تم وضع علامة الإنجاز في هذه الجلسة. انتقل للمستوى التالي عند استعدادك.
        </p>}
      </div>
    </section>
  );
}
