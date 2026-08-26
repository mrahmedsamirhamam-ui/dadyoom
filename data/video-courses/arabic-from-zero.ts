export type VideoCourseLesson = {
  id: string;
  title: string;
  summary: string;
  youtubeId: string;
  sourceTitle: string;
  sourceChannel: string;
  sourceUrl: string;
  objectives: string[];
  practice: string[];
};

export const arabicFromZeroCourse = {
  slug: "arabic-from-zero",
  title: "العربية من الصفر",
  subtitle: "القراءة والنطق والمحادثة للمبتدئين",
  audience: "المبتدئون والناطقون بغير العربية",
  level: "تمهيدي",
  estimatedLessons: 7,
  description:
    "مسار فيديو منظم داخل ضاديوم يبدأ بالحروف ثم الحركات والمدود وينتهي بعبارات يومية أساسية. الفيديو مصدر خارجي، بينما الأهداف والتدريبات وتنظيم الرحلة من ضاديوم.",
  lessons: [
    {
      id: "letters-1",
      title: "الحروف العربية — المجموعة الأولى",
      summary:
        "التعرف إلى أول مجموعة من الحروف وأصواتها وأشكالها داخل الكلمة.",
      youtubeId: "c-7SVieC_04",
      sourceTitle:
        "How to READ ARABIC? - The alphabet - Lesson 1",
      sourceChannel: "Arabic 101",
      sourceUrl:
        "https://www.youtube.com/watch?v=c-7SVieC_04",
      objectives: [
        "تمييز أصوات الحروف الأولى.",
        "ملاحظة تغير شكل الحرف حسب موقعه.",
        "قراءة كلمات عربية قصيرة جدًا.",
      ],
      practice: [
        "انطق الحروف بعد المعلّم مرتين.",
        "اكتب ثلاثة حروف في أول الكلمة ووسطها وآخرها.",
        "اختر كلمة قصيرة واقرأها أمام ضاد.",
      ],
    },
    {
      id: "letters-2",
      title: "الحروف العربية — المجموعة الثانية",
      summary:
        "استكمال الحروف مع التدريب على الربط بين الصوت والشكل.",
      youtubeId: "1AT7IMLcA58",
      sourceTitle:
        "How to READ ARABIC? - The alphabet - Lesson 2",
      sourceChannel: "Arabic 101",
      sourceUrl:
        "https://www.youtube.com/watch?v=1AT7IMLcA58",
      objectives: [
        "تمييز د، ذ، ر، ز، س، ش، ص، ض.",
        "التفريق بين الحروف المتقاربة شكلًا وصوتًا.",
        "قراءة مقاطع وكلمات بسيطة.",
      ],
      practice: [
        "كوّن أزواجًا بين الحرف وصوته.",
        "اكتب كلمة تبدأ بكل حرف من الحروف التي تعلمتها.",
        "سجّل قراءتك لكلمتين ثم قارن النطق بالفيديو.",
      ],
    },
    {
      id: "letters-3",
      title: "الحروف العربية — المجموعة الثالثة",
      summary:
        "التدريب على ط، ظ، ع، غ، ف، ق مع التركيز على مخارج الأصوات.",
      youtubeId: "8pfQg26vfaA",
      sourceTitle:
        "How to READ ARABIC? - The alphabet - Lesson 3",
      sourceChannel: "Arabic 101",
      sourceUrl:
        "https://www.youtube.com/watch?v=8pfQg26vfaA",
      objectives: [
        "تمييز الأصوات المفخمة والحلقية.",
        "قراءة كلمات تضم الحروف الجديدة.",
        "مراجعة مجموعات الحروف السابقة.",
      ],
      practice: [
        "فرّق شفهيًا بين ط وت، وبين ظ وذ.",
        "اقرأ ثلاث كلمات فيها ع أو غ.",
        "اطلب من ضاد اختبارًا سريعًا من خمسة حروف.",
      ],
    },
    {
      id: "letters-4",
      title: "اكتمال الأبجدية العربية",
      summary:
        "إكمال بقية الحروف والوصول إلى التعرف على الأبجدية العربية كاملة.",
      youtubeId: "LTwCmA6AjdI",
      sourceTitle:
        "How to READ ARABIC? - The alphabet - Lesson 4",
      sourceChannel: "Arabic 101",
      sourceUrl:
        "https://www.youtube.com/watch?v=LTwCmA6AjdI",
      objectives: [
        "التعرف إلى جميع الحروف العربية.",
        "تمييز شكل الحرف في مواضع الكلمة.",
        "الاستعداد للانتقال من الحروف إلى القراءة.",
      ],
      practice: [
        "رتّب الحروف العربية بالترتيب.",
        "اكتب اسمك أو كلمة مألوفة بالحروف التي تعلمتها.",
        "اقرأ خمسة حروف عشوائية دون مساعدة.",
      ],
    },
    {
      id: "short-vowels",
      title: "الحركات القصيرة والسكون",
      summary:
        "الفتحة والضمة والكسرة والسكون وكيف تغيّر صوت الحرف.",
      youtubeId: "T6uDEwYdbv4",
      sourceTitle:
        "ARABIC Short Vowels Explained - Lesson 1",
      sourceChannel: "Arabic 101",
      sourceUrl:
        "https://www.youtube.com/watch?v=T6uDEwYdbv4",
      objectives: [
        "معرفة الفتحة والضمة والكسرة.",
        "فهم السكون.",
        "قراءة كلمات ثلاثية مشكولة.",
      ],
      practice: [
        "اقرأ بَ، بِ، بُ بصوت واضح.",
        "ضع حركة مختلفة على ثلاثة حروف ولاحظ تغير الصوت.",
        "اقرأ ثلاث كلمات قصيرة مشكلة.",
      ],
    },
    {
      id: "long-vowels",
      title: "المدود والحركات الطويلة",
      summary:
        "التمييز بين الصوت القصير والصوت الممدود والتدريب على القراءة.",
      youtubeId: "iIM1q6_3U8o",
      sourceTitle:
        "Long Vowels in Arabic - Arabic Vowels for beginners - Lesson 4",
      sourceChannel: "Arabic 101",
      sourceUrl:
        "https://www.youtube.com/watch?v=iIM1q6_3U8o",
      objectives: [
        "تمييز الألف والواو والياء كحروف مد.",
        "مقارنة الحركة القصيرة بالصوت الطويل.",
        "قراءة كلمات تحتوي مدودًا.",
      ],
      practice: [
        "قارن بين بَ وبا، بُ وبو، بِ وبي.",
        "استخرج حرف المد من خمس كلمات.",
        "اكتب ثلاث كلمات فيها ألف مد وثلاثًا فيها واو أو ياء مد.",
      ],
    },
    {
      id: "daily-phrases",
      title: "عبارات عربية أساسية للمبتدئ",
      summary:
        "الانتقال من القراءة إلى الاستماع والمحادثة عبر عبارات وأفعال يومية.",
      youtubeId: "Jd_6QK5uvDE",
      sourceTitle:
        "50 Phrases Every Arabic Beginner Must-Know",
      sourceChannel:
        "Learn Arabic with ArabicPod101.com",
      sourceUrl:
        "https://www.youtube.com/watch?v=Jd_6QK5uvDE",
      objectives: [
        "فهم عبارات يومية شائعة.",
        "تقليد النطق والإيقاع.",
        "استخدام بعض العبارات في موقف حقيقي.",
      ],
      practice: [
        "اختر عشر عبارات واحفظ معناها.",
        "كوّن حوارًا قصيرًا من أربع جمل.",
        "تدرّب مع ضاد على محادثة تعارف بسيطة.",
      ],
    },
  ] satisfies VideoCourseLesson[],
} as const;
