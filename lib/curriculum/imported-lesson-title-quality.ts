/**
 * Heuristic for corrupt headings imported from OCR timetable/table rows.
 * This is a review warning, NEVER proof that a valid official lesson is absent.
 * Do not rename, delete or certify an existing lesson automatically.
 */
export function suspectImportedLessonTitleReason(value: string): string | null {
  const title = value.trim().replace(/\s+/gu, " ");
  if (!title) return "عنوان فارغ يحتاج الرجوع إلى فهرس الكتاب";

  if (/^اسم الكتاب\s*:/u.test(title) ||
      /^(?:[()\s]*الوحدة[()\s]*)(?:عنوان|الدّرس|الدرس|رقم|الصفحات|الصف)/u.test(title) ||
      /عنوان الدرس.*(?:الصفحات|الكتاب|الصفحة|الصف)/u.test(title)) {
    return "صف عنوان أو بيانات جدول مستوردة بدل عنوان درس";
  }
  if (/^ورقمه$/u.test(title) || /^[)(]+/u.test(title)) {
    return "جزء مبتور من جدول أو قوس OCR غير متوازن";
  }
  if (/^القراءة\s*[-–]?\s*(?:[0-9٠-٩]+)?\s*[-–]?$/u.test(title)) {
    return "حقل القراءة أو رقم صفحة لا يثبت عنوان درس";
  }
  if (/^(?:الدّرس|الدرس)(?:\s+(?:الأوّل|الأول|الثّاني|الثاني|الثّالث|الثالث|الرّابع|الرابع|الخامس|السّادس|السادس|السّابع|السابع|الثّامن|الثامن|التّاسع|التاسع|العاشر))?$/u.test(title)) {
    return "رقم درس عام بلا عنوان موضوعي من فهرس الكتاب";
  }
  return null;
}
