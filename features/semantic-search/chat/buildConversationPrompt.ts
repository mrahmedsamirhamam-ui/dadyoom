import type {
  LessonChatHistoryItem,
} from "./LessonChatContext";

type BuildConversationPromptParams = {
  query: string;
  contexts: string[];
  history: LessonChatHistoryItem[];
};

const INVALID_MEMORY_PATTERNS = [
  "لا توجد في نص الدرس معلومات كافية",
  "لا توجد معلومات كافية",
  "تعذر الحصول على الإجابة",
  "حدث خطأ",
];

function cleanConversationHistory(
  history: LessonChatHistoryItem[]
): LessonChatHistoryItem[] {
  return history
    .filter((message) => {
      if (message.role !== "assistant") {
        return true;
      }

      return !INVALID_MEMORY_PATTERNS.some(
        (pattern) =>
          message.content.includes(pattern)
      );
    })
    .slice(-10);
}

export function buildConversationPrompt({
  query,
  contexts,
  history,
}: BuildConversationPromptParams): string {
  const cleanHistory =
    cleanConversationHistory(history);

  const conversation = cleanHistory
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "الطالب"
          : "ضاد";

      return `${speaker}:
${message.content}`;
    })
    .join("\n\n");

  const lessonContext = contexts
    .filter(Boolean)
    .map(
      (context, index) =>
        `المقطع ${index + 1}:
${context}`
    )
    .join("\n\n");

  return `
أنت «ضاد»، معلم لغة عربية دقيق وودود لطلاب المرحلة الابتدائية.

أجب عن السؤال الحالي اعتمادًا على نص الدرس والمحادثة الصحيحة فقط.

قواعد إلزامية:
1. أجب عن السؤال الحالي مباشرة، ولا تبدأ بعبارة ترحيب.
2. التزم بنوع السؤال:
   - "كيف" تعني وصف الطريقة.
   - "لماذا" تعني بيان السبب أو الغرض.
   - "ماذا" تعني ذكر الشيء أو الفعل المطلوب.
3. عند سؤال "لماذا"، لا تكرر الطريقة على أنها إجابة.
4. إذا لم يذكر النص السبب بصراحة:
   - قل: "لم يذكر النص السبب صراحة".
   - ثم اذكر فقط الغرض الذي تدعمه أفعال الشخصية بوضوح.
5. لا تخترع سببًا لا يدعمه النص.
6. استخدم المحادثة السابقة لفهم الضمائر والإشارات.
7. أجب عن آخر سؤال فقط.
8. اجعل الإجابة قصيرة وواضحة ومناسبة لطالب الصف الرابع.
9. لا تكرر السؤال داخل الإجابة.
10. لا تقل إن المعلومات غير كافية ما دام النص يسمح بإجابة مباشرة أو استنتاج بسيط مؤيد بالأفعال.

مثال:
السؤال:
لماذا كان الرجل يقسم محصول الحديقة إلى ثلاثة أثلاث؟

الإجابة المناسبة:
لم يذكر النص السبب صراحة، لكنه يوضح أنه كان يوزع المحصول بعدل؛ فيخصص ثلثًا للصدقة، وثلثًا لنفسه وعياله، وثلثًا يعيده إلى الحديقة للعناية بها واستمرار إنتاجها.

المحادثة السابقة:
${conversation || "لا توجد محادثة سابقة صحيحة."}

مقتطفات الدرس:
${lessonContext || "لا توجد مقتطفات متاحة."}

السؤال الحالي:
${query}
`;
}
