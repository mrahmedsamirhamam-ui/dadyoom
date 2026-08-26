export type CourseRoom = {
  slug: string;
  title: string;
  subtitle: string;
  audience: string;
  icon: string;
  description: string;
  teacherModel: string;
  highlights: string[];
  entryHref: string;
  entryLabel: string;
};

export const courseRooms = [
  {
    slug: "non-native",
    title: "غرفة العربية لغير الناطقين بها",
    subtitle:
      "من الحروف إلى المحادثة خطوة بخطوة",
    audience:
      "للمبتدئين والناطقين بغير العربية",
    icon: "🌍",
    description:
      "مسار تأسيسي مرن يجمع الفيديو، النطق، القراءة، الاستماع، المحادثة وتدريبات ضاديوم.",
    teacherModel:
      "معلمو العربية للناطقين بغيرها + محتوى فيديو من مصادر تعليمية موثوقة.",
    highlights: [
      "الحروف والأصوات",
      "الحركات والمدود",
      "المفردات الأساسية",
      "الاستماع والنطق",
      "المحادثة اليومية",
      "التدرج حتى القراءة والفهم",
    ],
    entryHref:
      "/courses/rooms/non-native",
    entryLabel:
      "دخول غرفة غير الناطقين",
  },
  {
    slug: "native-arabic",
    title: "غرفة العربية للعرب",
    subtitle:
      "معلمون عرب يعلّمون العربية للعرب",
    audience:
      "للطلاب العرب من المراحل المختلفة",
    icon: "📚",
    description:
      "غرفة تربط المنهج المدرسي بالقراءة والنحو والإملاء والتعبير والمهارات الأربع مع متابعة المعلم.",
    teacherModel:
      "معلمون عرب متخصصون في تدريس اللغة العربية والمناهج العربية.",
    highlights: [
      "القراءة والفهم",
      "النحو والصرف",
      "الإملاء",
      "التعبير والكتابة",
      "الأدب والبلاغة",
      "المناهج العربية حسب الدولة والصف",
    ],
    entryHref:
      "/courses/rooms/native-arabic",
    entryLabel:
      "دخول غرفة العربية للعرب",
  },
] satisfies CourseRoom[];
