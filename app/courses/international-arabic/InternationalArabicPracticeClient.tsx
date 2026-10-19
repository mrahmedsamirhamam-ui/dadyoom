"use client";

import Link from "next/link";
import { useState } from "react";

type Challenge = {
  prompt: string;
  choices: [string, string, string];
  answerIndex: 0 | 1 | 2;
  explanation: string;
};
type MiniLesson = {
  id: string;
  programme: string;
  audience: string;
  title: string;
  goal: string;
  text: string;
  questions: [Challenge, Challenge];
  creative: string;
  support: string;
  core: string;
  extension: string;
  check: string;
};

const lessons: MiniLesson[] = [
  {
    id: "pyp",
    programme: "IB PYP — ورشة استقصاء",
    audience: "مرحلة ابتدائية • تكيف حسب مستوى العربية",
    title: "كيف تصبح المكتبة بيتًا لكل طفل؟",
    goal: "أن يميز الطالب الحاجة من الحل ويشرح رأيه بجملة مسندة بمثال.",
    text: "كانت مريم تحب القراءة، لكنها لاحظت أن زميلها آدم لا يستطيع الوصول إلى الكتب الموضوعة على الرف المرتفع. اقترحت أن يضع الفريق بعض الكتب في رف منخفض، وأن يصنع بطاقات مصورة للأطفال الجدد. جرب الطلاب الخطة أسبوعًا، ثم سألوا زملاءهم: هل أصبح العثور على الكتب أسهل؟ تعلموا أن الفكرة الجيدة تحتاج إلى ملاحظة وتجربة وسماع آراء الآخرين.",
    questions: [
      { prompt: "ما المشكلة التي لاحظتها مريم؟", choices: ["قلة الكتب في المدرسة", "صعوبة وصول آدم إلى بعض الكتب", "انتهاء وقت القراءة"], answerIndex: 1, explanation: "المعلومة واردة صراحة في الجملة الأولى؛ الرف المرتفع كان عائقًا." },
      { prompt: "أي فعل يدل على الاستقصاء بعد التجربة؟", choices: ["سؤال الطلاب عن سهولة العثور على الكتب", "تغيير اسم المكتبة", "إخفاء الكتب القديمة"], answerIndex: 0, explanation: "بعد التجربة طلبوا دليلًا من المستخدمين بدل الاكتفاء بالتوقع." },
    ],
    creative: "ارسم أو اكتب اقتراحًا آخر يجعل المكتبة أسهل لطفل جديد، وبيّن سبب فائدته.",
    support: "قدّم صورًا للرف المرتفع والرف المنخفض؛ اطلب اختيار المشكلة أولًا.",
    core: "استخدم مخطط مشكلة ← حل ← دليل لتبرير اقتراح مستقل.",
    extension: "اكتب سؤالين يجمعان رأي الزوار قبل أن تدّعي نجاح الحل.",
    check: "المعلم يلاحظ قدرة الطفل على الاستدلال والاقتراح، لا حفظ النص.",
  },
  {
    id: "myp-literature",
    programme: "IB MYP — اللغة والأدب",
    audience: "القراءة النقدية والتعبير • مثال داعم لا يحاكي اختبار IB",
    title: "هل يغيّر الراوي نظرتنا إلى الحدث؟",
    goal: "أن يفسر أثر اختيار الراوي للألفاظ في رسم الموقف بشاهدين.",
    text: "النص الأول: «استيقظ الحي مبكرًا. خرج الأطفال يحملون كتبًا لتنظيم معرض في الساحة، وقالت الجارة إن الفكرة تبعث الحياة في المكان». النص الثاني: «امتلأت الساحة بالضجيج منذ الصباح. تعثر المارة في الصناديق المتروكة، وتساءل أحد السكان لماذا لم يُنظَّم الممر أولًا». يصف النصان نشاطًا واحدًا، لكن أحدهما يبرز فائدته والآخر يلفت النظر إلى مشكلة تنظيمه.",
    questions: [
      { prompt: "أي عبارة أقرب إلى موقف الراوي في النص الأول؟", choices: ["الفكرة تبعث الحياة في المكان", "تعثر المارة في الصناديق", "لم ينظم أحد الممر"], answerIndex: 0, explanation: "هذا الشاهد من النص الأول ويحمل تقييمًا إيجابيًا واضحًا." },
      { prompt: "ما التفسير الأكثر اتزانًا لاختلاف النصين؟", choices: ["أحد الراويين يكذب بالضرورة", "كل واحد يختار تفاصيل مختلفة من الموقف", "كل المعارض فوضوية"], answerIndex: 1, explanation: "الاختلاف في المنظور واختيار التفاصيل لا يثبت وحده أن أحدهما يكذب." },
    ],
    creative: "اكتب فقرة بلسان زائر ثالث تذكر الإيجابيات والمشكلة، واستشهد بتفصيلين من النصين.",
    support: "حدد باللونين ألفاظ الرضا وألفاظ الانزعاج قبل صياغة التفسير.",
    core: "قارن الشاهد ودلالته في جدول منظور ← لفظ ← أثر.",
    extension: "ناقش كيف قد تتغير رسالة النص إذا أصبح الراوي طفلًا شارك في المعرض.",
    check: "يراجع المعلم سلامة تفسير النبرة وقوة الشواهد، لا مجرد اختيار إجابة.",
  },
  {
    id: "myp-acquisition",
    programme: "IB MYP — اكتساب العربية",
    audience: "لغة إضافية • لا نفترض أن المستوى يطابق سنة الطالب",
    title: "أتعرف إلى المكتبة وأطلب المساعدة",
    goal: "أن يصوغ الطالب طلبًا مهذبًا ويستنتج موقع كتاب من حوار.",
    text: "قالت ليلى: السلام عليكم، أبحث عن كتاب قصير عن الحيوانات. أجاب أمين المكتبة: أهلًا بكِ، الكتب المصورة في الرف الأول، والقصص الطويلة في الرف الثالث. قالت ليلى: شكرًا لك. هل يمكنني استعارة هذا الكتاب ليومين؟ أجاب: نعم، لكن سجلي الاسم في البطاقة أولًا.",
    questions: [
      { prompt: "أين توجد الكتب المصورة في الحوار؟", choices: ["الرف الثالث", "الرف الأول", "في قاعة الرياضة"], answerIndex: 1, explanation: "أشار أمين المكتبة إلى الرف الأول صراحة." },
      { prompt: "أي عبارة أنسب لطلب مهذب؟", choices: ["أعطني الكتاب الآن!", "لن آتي مرة أخرى.", "هل يمكنني استعارة هذا الكتاب؟"], answerIndex: 2, explanation: "صيغة «هل يمكنني» طلب مهذب يلائم الحوار." },
    ],
    creative: "كوّن حوارًا من أربعة أسطر تطلب فيه معلومات عن كتاب وتجيب عن موعد إرجاعه.",
    support: "بطاقات: أبحث عن / أين؟ / هل يمكنني؟ / شكرًا. اسمح بالإجابة الشفهية.",
    core: "أنشئ حوارًا مستقلًا مع استخدام مفردتين جديدتين.",
    extension: "أضف موقفًا لم يتوفر فيه الكتاب المطلوب واقترح بديلًا باحترام.",
    check: "يتحقق المعلم من التواصل وفهم المعلومات لا من النطق المطابق لنموذج واحد.",
  },
  {
    id: "dp-language-a",
    programme: "IB DP — دراسات اللغة والأدب",
    audience: "طلاب متقدمون • مثال أصلي وليس نص مقرر أو تقييم IB",
    title: "كيف يصنع الكاتب حجة عن القراءة الرقمية؟",
    goal: "أن يميز دعوى الكاتب من دليلها ويحلل أثر الأسلوب البلاغي.",
    text: "كتب محرر شاب: «لا ينبغي أن نسأل هل تنتصر الشاشة على الورق، بل كيف نحفظ للقراءة مكانًا في يومنا. يستطيع الهاتف أن يفتح أبوابًا واسعة للمعرفة، لكنه قد يغرق القارئ في إشعارات متلاحقة. إن المشكلة ليست في الوسيلة وحدها؛ إنها في عاداتنا وطريقة اختيار ما نقرأ». لا يقدم الكاتب إحصاءً علميًا عن سلوك الناس، وإنما موقفًا حجاجيًا يحتاج إلى أدلة مستقلة إذا أردنا اختباره.",
    questions: [
      { prompt: "ما الدعوى الأساسية الأقرب إلى النص؟", choices: ["القراءة الورقية ممنوعة", "اختيارات القراءة وعاداتها أهم من التنافس بين الوسيلتين", "كل إشعار يوقف التعلم نهائيًا"], answerIndex: 1, explanation: "حول الكاتب السؤال من صراع الورق والشاشة إلى عادات القراءة." },
      { prompt: "في «يفتح أبوابًا واسعة للمعرفة»، ما الوظيفة الأقرب للتعبير؟", choices: ["صورة مجازية توحي باتساع فرص التعلم", "بيان عدد أبواب حقيقي", "اقتباس من كتاب رسمي"], answerIndex: 0, explanation: "«الأبواب» هنا صورة تشبه إمكانات الوصول إلى المعرفة بالمداخل المتعددة." },
    ],
    creative: "اكتب اعتراضًا منصفًا ثم ردًا عليه، مع تحديد معلومة تحتاج إلى مصدر مستقل لا إلى انطباع.",
    support: "ساعد الطالب على وضع خط تحت الدعوى وتحديد العبارة المجازية.",
    core: "حلل الدعوى والاستدراك والوظيفة الإقناعية للصورة في فقرة.",
    extension: "قارن أثر أسلوب النص على قارئ رقمي وآخر يفضل الكتب، وناقش محدودية الاستدلال.",
    check: "تقييم كتابي بشري لجودة التحليل لا اعتماد آلي أو درجة DP.",
  },
  {
    id: "cambridge-0544",
    programme: "Cambridge IGCSE — العربية لغة أجنبية 0544",
    audience: "ممارسة لغوية أصلية • ليست ورقة امتحان Cambridge",
    title: "أخطط لزيارة المتحف",
    goal: "أن يستخرج الطالب الزمان والمكان من رسالة عربية وأن يرد برسالة قصيرة مناسبة.",
    text: "إلى صديقي سامر، السلام عليكم. سأزور متحف المدينة يوم السبت الساعة العاشرة صباحًا. سأذهب بالحافلة مع أخي، ونحتاج إلى الوصول مبكرًا لأن الزيارة تبدأ في العاشرة والنصف. هل ترغب في المجيء معنا؟ أرجو أن تخبرني قبل مساء الخميس. صديقك: مازن.",
    questions: [
      { prompt: "متى تبدأ الزيارة داخل المتحف؟", choices: ["السبت العاشرة والنصف", "الخميس صباحًا", "السبت التاسعة"], answerIndex: 0, explanation: "ذُكر وقت الذهاب الساعة العاشرة، لكن بداية الزيارة العاشرة والنصف." },
      { prompt: "متى طلب مازن الرد؟", choices: ["بعد انتهاء الزيارة", "قبل مساء الخميس", "صباح الأحد"], answerIndex: 1, explanation: "حدد الكاتب موعد الرد في آخر الرسالة." },
    ],
    creative: "اكتب ردًا من أربع جمل يبين الموافقة أو الاعتذار مع سبب وسؤال واحد.",
    support: "تحديد كلمات الزمان ووسيلة النقل باللون، ثم نموذج رد قصير.",
    core: "اكتب ردًا يحافظ على التحية والمعنى ويجيب عن الطلب.",
    extension: "غيّر طريقة الوصول أو موعد الزيارة واقترح خطة بديلة مع تفسير.",
    check: "هذا تدريب على القراءة والكتابة؛ لم يُختبر الاستماع أو التحدث امتحانيًا هنا.",
  },
  {
    id: "cambridge-0508",
    programme: "Cambridge IGCSE — العربية لغة أولى 0508",
    audience: "قراءة تحليلية ونص حجاجي من تأليف ضاديوم",
    title: "ما قيمة الوقت الذي نقضيه في القراءة؟",
    goal: "أن يميز الطالب فكرة الكاتب من التعليل ثم يكتب ملخصًا أمينًا دون تعميم.",
    text: "تتيح المكتبات الرقمية للقارئ الوصول إلى آلاف الكتب، لكنها لا تضمن أن يستفيد من كل ما يفتحه. فقد يبدأ بعض الطلاب قراءة مقال مهم ثم ينتقلون إلى صفحات أخرى قبل إكمال الفكرة. ويستطيع المعلم أن يساعدهم بتحديد غرض واضح للقراءة، وبطلب ملخص صغير يختبر مدى فهمهم. غير أن ذلك لا يعني أن الكتاب الورقي دائمًا أفضل من الرقمي؛ فالنتيجة تعتمد أيضًا على طبيعة النص وحاجة القارئ وطريقة العمل.",
    questions: [
      { prompt: "ما وظيفة عبارة «غير أن ذلك لا يعني»؟", choices: ["إلغاء فكرة القراءة نهائيًا", "الانتقال إلى تقييد تعميم محتمل", "تحديد عدد الكتب"], answerIndex: 1, explanation: "يعالج الكاتب استنتاجًا متسرعًا ويقيد الحكم على الوسيلتين." },
      { prompt: "أي ملخص أكثر أمانة للنص؟", choices: ["الكتب الرقمية لا تنفع أحدًا", "المكتبات الورقية وحدها تضمن التعلم", "فائدة القراءة تتأثر بالغاية والتركيز وطبيعة النص لا بالوسيلة وحدها"], answerIndex: 2, explanation: "الملخص الثالث يحفظ المقارنة وشروط الفائدة دون إطلاق أحكام لم ترد." },
    ],
    creative: "لخّص النص في 55–70 كلمة، ثم اكتب فقرة تناقش أحد حلوله بدليل.",
    support: "تمييز أدوات الربط «لكن، فقد، غير أن» مع تحديد وظيفة كل واحدة.",
    core: "خريطة فكرة ← تعليل ← مثال ← قيد، ثم كتابة ملخص.",
    extension: "قيم الافتراضات غير المسندة ببيانات وحدد ما يلزم للبحث عن أثر الوسيلة.",
    check: "يراجع المعلم دقة التلخيص والبناء اللغوي؛ التمرين ليس محاكاة مطابقة لورقة 0508.",
  },
  {
    id: "pearson-first",
    programme: "Pearson Edexcel International GCSE — العربية أولى",
    audience: "مهارات قراءة وتحرير وتعبير أصلية",
    title: "خبر صحفي أم رأي شخصي؟",
    goal: "أن يفرق الطالب بين المعلومة والرأي ويحرر جملًا دقيقة تعبر عن الحجة.",
    text: "نشرت المدرسة بيانًا أعلنت فيه إنشاء ركن جديد لتبادل الكتب بين الطلاب، على أن يبدأ العمل به في الشهر المقبل. وكتب أحد الطلاب تعليقًا: «ستكون هذه أفضل مبادرة في تاريخ المدرسة». أما مسؤولة المكتبة فقالت إن نجاح المبادرة يتطلب تنظيم مواعيد التبادل وحماية الكتب من التلف. يمكن فحص موعد الافتتاح بالرجوع إلى الإعلان، لكن الحكم بأنها «الأفضل في التاريخ» يحتاج إلى معيار وأدلة مقارنة.",
    questions: [
      { prompt: "أي عبارة تمثل رأيًا تقويميًا؟", choices: ["سيبدأ العمل في الشهر المقبل", "ستكون هذه أفضل مبادرة في تاريخ المدرسة", "ورد البيان عن المدرسة"], answerIndex: 1, explanation: "«الأفضل» حكم يتطلب معيارًا وأدلة، ولا يثبت بمجرد حماس قائله." },
      { prompt: "ما أفضل خطوة للتحقق من تاريخ الافتتاح؟", choices: ["العودة إلى البيان الرسمي للمدرسة", "تصديق رأي أول طالب", "اختيار موعد عشوائي"], answerIndex: 0, explanation: "البيان هو المصدر المباشر المعلن للموعد." },
    ],
    creative: "اكتب إعلانًا مدرسيًا من خمس جمل ثم رأيًا من سطرين، مع الفصل الواضح بين الوقائع والتوقعات.",
    support: "صنف الجمل في بطاقتين «خبر قابل للتحقق / رأي يحتاج دليلًا».",
    core: "اكتب فقرة تجمع خبرًا واحدًا ورأيًا مع تعليل.",
    extension: "صمم معيارين يمكن استخدامهما في قياس نجاح المبادرة بعد إطلاقها.",
    check: "التصحيح المدرسي يراجع الدقة والنحو وجودة الحجج؛ لا يمنح نتيجة Pearson رسمية.",
  },
];

function Workshop({ lesson }: { lesson: MiniLesson }) {
  const [choices, setChoices] = useState<Record<number, number>>({});
  const answered = lesson.questions.filter((_, i) => choices[i] !== undefined).length;
  const score = lesson.questions.filter((question, i) => choices[i] === question.answerIndex).length;

  return (
    <article id={lesson.id} className="scroll-mt-28 rounded-[2rem] border border-[#dac7a5] bg-white p-5 text-[#123f39] shadow-sm sm:p-8">
      <p className="text-sm font-black text-[#987028]">{lesson.programme} • {lesson.audience}</p>
      <h2 className="mt-2 font-arabic-display text-2xl font-black leading-[1.5] sm:text-3xl">{lesson.title}</h2>
      <p className="mt-3 rounded-2xl bg-[#eff6ed] p-4 font-arabic-reading text-lg leading-8"><strong>هدفي:</strong> {lesson.goal}</p>
      <div className="mt-5 space-y-2">
        <h3 className="text-xl font-black">نص أصلي من ضاديوم — أقرأ وأفهم</h3>
        <p className="rounded-2xl bg-[#faf5ea] p-4 font-arabic-reading text-lg leading-[2]">{lesson.text}</p>
      </div>
      <div className="mt-6 space-y-5">
        <h3 className="text-xl font-black">أتدرب وأفسّر</h3>
        {lesson.questions.map((question, questionIndex) => (
          <fieldset key={questionIndex} className="space-y-3 rounded-2xl border border-[#d1ded4] p-4">
            <legend className="px-2 text-base font-black leading-8">{questionIndex + 1}. {question.prompt}</legend>
            {question.choices.map((choice, choiceIndex) => {
              const selected = choices[questionIndex] === choiceIndex;
              return <button type="button" key={choiceIndex} aria-pressed={selected}
                className={"block min-h-11 w-full rounded-xl border p-3 text-right text-base leading-7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b78d48] " +
                  (selected ? "border-[#347a67] bg-[#e2f1e9] font-bold" : "border-[#d9d8ca] bg-white hover:border-[#347a67]")}
                onClick={() => setChoices((prev) => ({ ...prev, [questionIndex]: choiceIndex }))}>
                {choice}
              </button>;
            })}
            {choices[questionIndex] !== undefined ? (
              <p role="status" className="rounded-xl bg-[#f8f0dd] p-3 text-sm leading-8">
                <strong>{choices[questionIndex] === question.answerIndex ? "أحسنت! " : "راجع النص وحاول مجددًا. "}</strong>
                {question.explanation}
              </p>
            ) : null}
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#e9f3e9] p-4 text-sm font-bold">
          <span>إجاباتك: {answered}/{lesson.questions.length} • الصحيحة حاليًا: {score}/{lesson.questions.length}</span>
          <button type="button" className="min-h-11 rounded-xl border border-[#3f7766] bg-white px-4 py-2" onClick={() => setChoices({})}>أعيد التدريب</button>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border-r-4 border-[#b89150] bg-[#fff8e8] p-5">
        <h3 className="font-black">أتحدث أو أكتب بإبداع</h3>
        <p className="mt-2 font-arabic-reading leading-8">{lesson.creative}</p>
        <p className="mt-2 text-xs leading-6">لا يصحح ضاديوم هذا التعبير آليًا؛ ناقشه مع المعلم أو مع من يساعدك.</p>
      </div>
      <details className="mt-5 rounded-2xl border border-[#b5d3c2] bg-[#f2f9f4] p-5">
        <summary className="cursor-pointer text-lg font-black">دليل المعلم: الفروق الفردية والتقويم</summary>
        <dl className="mt-3 space-y-3 text-sm leading-8">
          <div><dt className="font-black">مسار الدعم</dt><dd>{lesson.support}</dd></div>
          <div><dt className="font-black">المسار الأساسي</dt><dd>{lesson.core}</dd></div>
          <div><dt className="font-black">مسار التحدي</dt><dd>{lesson.extension}</dd></div>
          <div><dt className="font-black">معيار التحقق</dt><dd>{lesson.check}</dd></div>
        </dl>
      </details>
    </article>
  );
}

export default function InternationalArabicPracticeClient() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#faf5eb] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <div className="rounded-[2rem] bg-[#113f38] p-6 text-white sm:p-9">
          <Link href="/courses/international-arabic" className="text-sm font-bold text-[#edca85] hover:underline">← دليل المناهج الدولية</Link>
          <h1 className="mt-4 font-arabic-display text-3xl font-black leading-[1.5] sm:text-4xl">مختبر ضاديوم العالمي: جرّب العربية وتعلّمها</h1>
          <p className="mt-4 font-arabic-reading text-lg leading-9">
            نماذج دروس قصيرة من تأليف ضاديوم، تتدرج من الاستقصاء إلى البلاغة والكتابة.
            اختر المسار، اقرأ، أجب، ثم ابتكر. للمعلم إرشادات الدعم والأساس والتحدي.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#ead7b8]">هذه نماذج دعم وتدريب مجاني، لا تمثل كتابًا رسميًا أو اختبارات مماثلة أو اعتمادًا من IB أو Cambridge أو Pearson؛ والإجابات لا تُحفظ في حساب الطالب.</p>
        </div>
        <nav aria-label="اختر ورشة العربية" className="flex flex-wrap gap-2">
          {lessons.map((lesson) => (
            <a href={"#" + lesson.id} key={lesson.id} className="inline-flex min-h-11 items-center rounded-xl border border-[#b9aa8c] bg-white px-4 py-2 text-sm font-bold text-[#143f38] hover:bg-[#e9f3ed]">
              {lesson.programme}
            </a>
          ))}
        </nav>
        <div className="space-y-7">
          {lessons.map((lesson) => <Workshop key={lesson.id} lesson={lesson} />)}
        </div>
        <div className="rounded-2xl border border-[#d9c8a6] bg-white p-5 text-sm leading-8">
          للاعتماد المدرسي والامتحانات ينبغي الرجوع دائمًا إلى مواصفة الجهة المانحة وسنة الاختبار ومراجع المعلم المرخصة.
          <div className="mt-3"><Link href="/courses/international-arabic" className="font-black text-[#126257] underline">المصادر الرسمية للبرامج الدولية ←</Link></div>
        </div>
      </div>
    </main>
  );
}
