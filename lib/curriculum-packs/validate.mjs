
const LESSON_TYPES = new Set(["reading", "writing", "listening", "speaking", "grammar", "vocabulary"]);

/**
 * Recognize the exact non-teaching boilerplate found in legacy Bahrain
 * textbook/TOC scrape records. Its 170–240 characters satisfy a naive
 * minimum-length rule but contain no actual lesson or assessed learning.
 *
 * Conservative on purpose: this is a known-template fingerprint, not an
 * automatic judgment that every short text or grade-level title is wrong.
 * Only the explicit pattern is rejected; other content needs human review.
 */
export function isGenericLessonPlaceholder(content) {
  if (typeof content !== "string") return false;
  const value = content.trim();
  return value.startsWith("يتناول هذا الدرس موضوع «") &&
    value.includes("يبدأ التعلم بتهيئة قصيرة") &&
    value.includes("واستخراج الفكرة الرئيسة");
}

export function validateCurriculumPack(pack) {
  const errors = [];
  const text = (value) => typeof value === "string" && value.trim().length > 0;

  if (pack?.schemaVersion !== 1) errors.push("schemaVersion must equal 1");
  if (!text(pack?.packKey)) errors.push("packKey is required");
  if (!/^[A-Z]{2}$/.test(pack?.country?.code || "")) errors.push("country.code must be ISO alpha-2");
  if (!text(pack?.country?.nameAr)) errors.push("country.nameAr is required");
  if (!text(pack?.academicYear)) errors.push("academicYear is required");
  if (pack?.subject?.code !== "arabic") errors.push("MVP subject must be arabic");
  if (pack?.subject?.nameAr !== "اللغة العربية") errors.push("subject.nameAr must be اللغة العربية");
  if (!text(pack?.stage?.code) || !text(pack?.stage?.nameAr)) errors.push("stage is required");
  if (!Number.isInteger(pack?.grade?.number) || pack.grade.number < 1 || pack.grade.number > 13) errors.push("grade.number must be 1..13");
  if (!text(pack?.grade?.nameAr)) errors.push("grade.nameAr is required");
  if (![null, 1, 2, 3].includes(pack?.semester ?? null)) errors.push("semester must be null/1/2/3");
  if (!text(pack?.curriculum?.nameAr)) errors.push("curriculum.nameAr is required");
  if (!pack?.rights?.verified) errors.push("rights.verified must be true before import");
  if (!text(pack?.rights?.sourceLabel)) errors.push("rights.sourceLabel is required");

  const units = Array.isArray(pack?.units) ? pack.units : [];
  if (!units.length) errors.push("at least one unit is required");

  const seenUnitNumbers = new Set();
  for (const unit of units) {
    // Official textbooks often restart lesson numbering within each unit.
    const seenLessonNumbers = new Set();
    if (!Number.isInteger(unit?.number) || unit.number < 1) errors.push(`invalid unit number: ${unit?.number}`);
    if (seenUnitNumbers.has(unit?.number)) errors.push(`duplicate unit number: ${unit?.number}`);
    seenUnitNumbers.add(unit?.number);
    if (!text(unit?.title)) errors.push(`unit ${unit?.number}: title required`);
    const lessons = Array.isArray(unit?.lessons) ? unit.lessons : [];
    if (!lessons.length) errors.push(`unit ${unit?.number}: no lessons`);

    for (const lesson of lessons) {
      const prefix = `unit ${unit?.number} lesson ${lesson?.number}`;
      if (!Number.isInteger(lesson?.number) || lesson.number < 1) errors.push(`${prefix}: invalid number`);
      if (seenLessonNumbers.has(lesson?.number)) errors.push(`${prefix}: duplicate lesson number within unit`);
      seenLessonNumbers.add(lesson?.number);
      if (!text(lesson?.title)) errors.push(`${prefix}: title required`);
      if (!LESSON_TYPES.has(lesson?.type)) errors.push(`${prefix}: invalid lesson type ${lesson?.type}`);
      if (!text(lesson?.summary)) errors.push(`${prefix}: summary required`);
      if (!text(lesson?.content) || lesson.content.trim().length < 120) errors.push(`${prefix}: content must be >=120 chars`);
      if (isGenericLessonPlaceholder(lesson?.content)) errors.push(`${prefix}: generic source placeholder is not a teachable lesson`);
      if (!Array.isArray(lesson?.objectives) || lesson.objectives.filter(text).length < 1) errors.push(`${prefix}: objectives required`);
      const questions = Array.isArray(lesson?.questions) ? lesson.questions : [];
      if (questions.length < 3) errors.push(`${prefix}: at least 3 questions required`);
      questions.forEach((q, index) => {
        if (q?.type !== "multiple_choice") errors.push(`${prefix} q${index + 1}: only multiple_choice supported in MVP`);
        if (!text(q?.question)) errors.push(`${prefix} q${index + 1}: question required`);
        const opts = Array.isArray(q?.options) ? q.options : [];
        if (opts.length < 2) errors.push(`${prefix} q${index + 1}: at least 2 options`);
        const ids = new Set(opts.map((o) => o?.id));
        if (ids.size !== opts.length || [...ids].some((id) => !text(id))) errors.push(`${prefix} q${index + 1}: option ids must be unique/non-empty`);
        if (!ids.has(q?.correctAnswer)) errors.push(`${prefix} q${index + 1}: correctAnswer must match option id`);
      });
    }
  }

  return { ok: errors.length === 0, errors };
}
