export const DADYOOM_FEATURE_POLICY = {
  study: {
    powerpointPrimary: true,
    summarySecondary: true,
    powerpointMustBeFullLessonDeck: true,
    powerpointMinimumTargetSlides: 8,
    allowPrint: true,
    allowDownload: true,
  },
  games: {
    automaticFromLessonContent: true,
    reusableGameTemplates: true,
    changeContentNotGameEngine: true,
  },
  ads: {
    free: true,
    plus: false,
  },
  aiLimits: {
    freeVideoPerDay: 5,
    freeCustomPptxPerDay: 5,
    freeCustomSummaryPerDay: 5,
  },
  chatbot: {
    staticAvatarPreferred: true,
    animatedCharacterRequired: false,
  },
} as const;

