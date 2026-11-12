/**
 * Dadyoom role experience policy. No mocked counters or grades live here:
 * the actual dashboards provide trusted, scoped information.
 */
export type WarmPortalRole = "student" | "teacher" | "parent" | "school";

export type PortalAction = Readonly<{
  title: string;
  href: string;
}>;

export type TourStep = Readonly<{
  title: string;
  description: string;
}>;

export type PortalExperience = Readonly<{
  title: string;
  welcome: string;
  subtitle: string;
  primaryAction: PortalAction;
  steps: readonly [TourStep, TourStep, TourStep];
}>;

export const PORTAL_EXPERIENCE: Record<WarmPortalRole, PortalExperience> = {
  student: {
    title: "مساحة الطالب",
    welcome: "مرحبًا بعودتك!",
    subtitle: "أكمل من حيث وصلت، وتعلّم بطريقتك، وتقدم خطوة بعد أخرى.",
    primaryAction: { title: "تابع رحلتك", href: "/journey" },
    steps: [
      { title: "هذه مساحتك", description: "ابدأ من رحلتك التعليمية أو اختر درسًا مناسبًا لمنهجك." },
      { title: "خطوتك التالية واضحة", description: "ستجد روابط الدروس والمهارات والتقدم في الوصول السريع." },
      { title: "تدرّب واحتفل بإنجازك", description: "تحقق من تقدمك الحقيقي، واستعن بضاد حين تحتاج إلى شرح." },
    ],
  },
  teacher: {
    title: "مساحة المعلم",
    welcome: "أهلًا بك في يومك الدراسي!",
    subtitle: "فصولك ودروسك ونتائج طلابك في مكان واحد.",
    primaryAction: { title: "إدارة فصولي", href: "/teacher/classroom" },
    steps: [
      { title: "ابدأ من فصلك", description: "انتقل إلى مساحة الفصل لتنظيم عملك اليومي." },
      { title: "اختر درسك", description: "تصفّح المناهج والدروس، ثم استخدم الأدوات المتاحة لك." },
      { title: "تابع تقدّم الطلاب", description: "راجع البيانات المتاحة لك داخل صلاحياتك، وحدد أولويات الدعم." },
    ],
  },
  parent: {
    title: "مساحة ولي الأمر",
    welcome: "مرحبًا بك!",
    subtitle: "تابع تعلم أبنائك، وشاركهم فرحة كل تقدم.",
    primaryAction: { title: "متابعة الأبناء", href: "/parent" },
    steps: [
      { title: "مكانك لمتابعة أبنائك", description: "ابدأ بربط حساب ابنك بالطريقة الآمنة المتاحة في مساحتك." },
      { title: "إنجازات واضحة", description: "ستظهر بيانات التقدم فقط عندما تتوافر من الحسابات المرتبطة." },
      { title: "مساندة صغيرة تصنع فرقًا", description: "اختر نشاطًا قصيرًا يناسب ما يحتاج ابنك إلى مراجعته." },
    ],
  },
  school: {
    title: "مساحة المدرسة",
    welcome: "أهلًا بكم!",
    subtitle: "إدارة منظمة ورؤية تعليمية تساعد على اتخاذ قرارات أوضح.",
    primaryAction: { title: "عرض التقارير", href: "/school/reports" },
    steps: [
      { title: "نظرة على المدرسة", description: "ابدأ من لوحة المدرسة لمتابعة الفصول والمعلمين المرتبطين." },
      { title: "تقارير قابلة للعمل", description: "انتقل إلى التقارير لقراءة المؤشرات المعتمدة المتاحة لحسابك." },
      { title: "إجراء واضح لكل متابعة", description: "استخدم الأدوات الإدارية وفق صلاحياتك دون عرض بيانات غير مخوّل بها." },
    ],
  },
} as const;
