type Props = {
  variant: "mobile" | "desktop";
  hasObjectives: boolean;
  hasVocabulary: boolean;
  hasSource: boolean;
  hasTutor: boolean;
};
const links = [
  { id: "lesson-overview", icon: "◈", name: "مقدمة الدرس" },
  { id: "lesson-objectives", icon: "◎", name: "الأهداف", check: "objectives" },
  { id: "lesson-explanation", icon: "📖", name: "شرح الدرس" },
  { id: "lesson-practice", icon: "✏️", name: "طبّق بنفسك" },
  { id: "lesson-assessment", icon: "✓", name: "اختبر فهمك" },
  { id: "lesson-vocabulary", icon: "🔤", name: "المفردات", check: "vocabulary" },
  { id: "lesson-assistant", icon: "✦", name: "مساعدة الدرس", check: "tutor" },
  { id: "lesson-source", icon: "↗", name: "المصدر", check: "source" },
  { id: "lesson-extras", icon: "★", name: "الألعاب والأدوات" },
  { id: "lesson-final-quiz", icon: "🏁", name: "الاختبار الذكي" },
] as const;

export default function LessonPageJourneyNav(props: Props) {
  const items = links.filter(item =>
    !("check" in item) ||
    (item.check === "objectives" && props.hasObjectives) ||
    (item.check === "vocabulary" && props.hasVocabulary) ||
    (item.check === "source" && props.hasSource) ||
    (item.check === "tutor" && props.hasTutor)
  );
  const mobile = props.variant === "mobile";
  return (
    <nav aria-label="خريطة رحلة التعلم"
      className={mobile
        ? "rounded-2xl border border-[#decaa3] bg-white p-3 lg:hidden"
        : "rounded-3xl border border-[#decaa3] bg-white p-5 shadow-sm"}>
      <p className="mb-3 text-sm font-black text-[#75561e]">خريطة رحلة التعلم</p>
      <ol className={mobile ? "flex gap-2 overflow-x-auto pb-2"
        : "grid max-h-[calc(100dvh-11rem)] gap-1 overflow-y-auto"}>
        {items.map((item, index) => (
          <li key={item.id} className={mobile ? "shrink-0" : ""}>
            <a href={"#" + item.id} className={"flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black " +
              (index === 0 ? "bg-[#123f39] text-white" : "text-[#244d41] hover:bg-[#f3ecdd]")}>
              <span aria-hidden="true">{item.icon}</span><span>{item.name}</span>
            </a>
          </li>
        ))}
      </ol>
      {!mobile && <p className="mt-4 rounded-xl bg-[#f7efdf] p-3 text-xs leading-6 text-[#675c49]">
        اقرأ وافهم، ثم طبّق، ثم اختبر نفسك.
      </p>}
    </nav>
  );
}
