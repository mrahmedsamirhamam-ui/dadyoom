import type { UnifiedLearningObjective } from "../services/unified-objective-contract";

/**
 * Illustrative Dadyoom-created lesson. The identifiers are synthetic.
 * NOT a government source, curriculum match, or approved classroom release.
 * The "approved" flag only exercises the local demonstration contract.
 */
export const nominalVerbalSentencesDemo: UnifiedLearningObjective = {
  id: "c3333333-3333-4333-8333-333333333333",
  lessonId: "d4444444-4444-4444-8444-444444444444",
  objective: "أن يُميّز الطالبُ الجملةَ الاسميةَ من الجملةِ الفعليةِ في نصٍّ لغويٍّ قصيرٍ.",
  observableSuccessCriterion:
    "تصنيف جمل جديدة تصنيفًا صحيحًا، مع ذكر دليل نحوي لكل جملة دون تلميح.",
  editoriallyApproved: true,
  curriculumAlignments: [], // verified ministry/Cambridge/IB mappings added only with sources
  strategies: [
    {
      learningObjectiveId: "c3333333-3333-4333-8333-333333333333",
      id: "visual",
      label: "ألاحظ وأصنّف",
      explanation:
        "يلاحظ المتعلم الجملتين وأركانهما بالألوان وبطاقات قابلة للنقل.",
      teachingActivities: [
        "ميّز «الطالبُ مجتهدٌ» بلون للمبتدأ وآخر للخبر.",
        "ميّز «يقرأُ الطالبُ» بلون للفعل وآخر للفاعل.",
        "اصنّف البطاقات في مجموعتين دون الاكتفاء بأول حرف من الجملة.",
      ],
    },
    {
      learningObjectiveId: "c3333333-3333-4333-8333-333333333333",
      id: "inquiry",
      label: "أقرأ وأستنتج",
      explanation:
        "نقرأ فقرة قصيرة، ثم نكتشف بنية كل جملة ونعلّل التصنيف.",
      teachingActivities: [
        "اقرأ «الفصلُ هادئٌ. دخلَ المعلمُ. الطلابُ يستمعونَ».",
        "حدّد الجملة الفعلية، ثم فسّر سبب كون «الطلابُ يستمعونَ» جملة اسمية خبرُها جملة فعلية.",
        "قارن «الولدُ يكتبُ» و«يكتبُ الولدُ» وناقش الفرق.",
      ],
    },
    {
      learningObjectiveId: "c3333333-3333-4333-8333-333333333333",
      id: "creative",
      label: "أحلّل وأعيد الصياغة",
      explanation:
        "أحلّل تركيبين متقابلين وأعيد صياغتهما مع المحافظة على سلامة المعنى والبنية.",
      teachingActivities: [
        "حلّل «الطالبةُ ترسمُ لوحةً» و«ترسمُ الطالبةُ لوحةً» مع تحديد الركنين.",
        "اكتب وصفًا يتضمن جملة اسمية وأخرى فعلية، وعلّل تصنيف كل منهما.",
      ],
    },
  ],
  assessments: [
    {
      learningObjectiveId: "c3333333-3333-4333-8333-333333333333",
      tier: "support",
      responseMode: "drag_drop",
      prompt:
        "اسحب «الزهرةُ جميلةٌ» و«تفتّحتِ الزهرةُ» إلى خانتَي الجملة الاسمية والفعلية.",
      formativeHint:
        "تأمل البنية: هل بدأت الجملة باسم يتكوّن منه إسناد، أم بفعل؟",
      rubric: [
        "تصنيف الجملة الاسمية",
        "تصنيف الجملة الفعلية",
      ],
      requiresHumanReview: false,
    },
    {
      learningObjectiveId: "c3333333-3333-4333-8333-333333333333",
      tier: "application",
      responseMode: "short_answer",
      prompt:
        "صنّف «الطالبُ يقرأُ» و«يقرأُ الطالبُ»، ثم حدّد المبتدأ والخبر في الأولى، والفعل والفاعل في الثانية.",
      rubric: [
        "صحة تصنيف الجملتين",
        "تحديد المبتدأ والخبر (الجملة الفعلية) في الأولى",
        "تحديد الفعل والفاعل في الثانية",
      ],
      requiresHumanReview: true,
    },
    {
      learningObjectiveId: "c3333333-3333-4333-8333-333333333333",
      tier: "challenge",
      responseMode: "constructed_response",
      prompt:
        "اكتب جملتين متقابلتين تعبّران عن حدث واحد: إحداهما اسمية خبرها جملة فعلية، والأخرى فعلية. بيّن الأركان النحوية وعلّل تصنيف كل منهما.",
      rubric: [
        "سلامة البناء النحوي للجملة الاسمية",
        "سلامة البناء النحوي للجملة الفعلية",
        "دقة تعيين المبتدأ والخبر والفعل والفاعل",
        "وضوح التعليل والمقارنة دون التباس",
      ],
      requiresHumanReview: true,
    },
  ],
};
