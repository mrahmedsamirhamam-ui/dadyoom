import type { UnifiedLearningObjective } from "../services/unified-objective-contract";

/**
 * ORIGINAL DIDACTIC EXAMPLE, NOT a verified ministry/Cambridge/IB mapping.
 * Use only in isolated authoring preview; never publish as official curriculum.
 */
export const subjectPredicateDemo: UnifiedLearningObjective = {
  id: "a1111111-1111-4111-8111-111111111111",
  lessonId: "b2222222-2222-4222-8222-222222222222",
  objective: "أن يحدّد الطالب المبتدأ والخبر ويوظّفهما في جملة اسمية صحيحة.",
  observableSuccessCriterion: "تحديد الركنين وتكوين جملة صحيحة في تقويم مستقل دون تلميحات.",
  editoriallyApproved: true, // sample data is locally reviewed, not nationally accredited
  curriculumAlignments: [], // no unsupported syllabus matching
  strategies: [
    {
      learningObjectiveId: "a1111111-1111-4111-8111-111111111111",
      id: "visual",
      label: "أرى وأميّز",
      explanation: "لوّن المبتدأ بلون والخبر بلون آخر، ثم لاحظ العلاقة بينهما.",
      teachingActivities: [
        "اعرض جملة «السماءُ صافيةٌ» مع تمييز الركنين بالألوان.",
        "انقل الكلمتين إلى بطاقتي «المبتدأ» و«الخبر».",
      ],
    },
    {
      learningObjectiveId: "a1111111-1111-4111-8111-111111111111",
      id: "inquiry",
      label: "أستكشف وأستنتج",
      explanation: "اقرأ سردًا قصيرًا واستخرج الجمل الاسمية ثم استنتج وظيفة كل ركن.",
      teachingActivities: [
        "اقرأ «الحديقةُ جميلةٌ. الأشجارُ باسقةٌ».",
        "استخرج المبتدأ والخبر، ثم اشرح كيف أتمّ الخبر معنى الجملة.",
      ],
    },
    {
      learningObjectiveId: "a1111111-1111-4111-8111-111111111111",
      id: "creative",
      label: "أحلّل وأبدع",
      explanation: "قارن تراكيب متنوعة، وبيّن ما يتغير حين يتقدّم الخبر وفق قواعد صحيحة.",
      teachingActivities: [
        "قارن «في الفصلِ طالبٌ» و«الطالبُ في الفصلِ» مع بيان الوظائف.",
        "اكتب جملتين اسميتين مختلفتي التركيب ثم علّل اختيارك.",
      ],
    },
  ],
  assessments: [
    {
      learningObjectiveId: "a1111111-1111-4111-8111-111111111111",
      tier: "support",
      responseMode: "drag_drop",
      prompt: "اسحب كلمتي «القمرُ منيرٌ» إلى خانتي المبتدأ والخبر.",
      formativeHint: "اسأل: عمّن نتحدّث؟ وماذا قلنا عنه؟",
      rubric: ["تحديد المبتدأ", "تحديد الخبر"],
      requiresHumanReview: false,
    },
    {
      learningObjectiveId: "a1111111-1111-4111-8111-111111111111",
      tier: "application",
      responseMode: "short_answer",
      prompt: "حدّد المبتدأ والخبر في «القراءةُ مفيدةٌ» ثم اكتب جملة مماثلة.",
      rubric: ["تمييز الركنين", "سلامة الجملة المنتجة"],
      requiresHumanReview: true,
    },
    {
      learningObjectiveId: "a1111111-1111-4111-8111-111111111111",
      tier: "challenge",
      responseMode: "constructed_response",
      prompt: "حلّل «في الحديقةِ أزهارٌ» و«الأزهارُ في الحديقةِ»، ثم اكتب مثالًا ثالثًا وعلّل الترتيب.",
      rubric: ["دقة التحليل النحوي", "صحة المثال الجديد", "سلامة التعليل"],
      requiresHumanReview: true,
    },
  ],
};
