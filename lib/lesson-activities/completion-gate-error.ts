/** Only recognised student-actionable completion blocks are HTTP 409.
 * Unexpected database/runtime failures stay HTTP 500; never bypass mastery.
 */
export function isCompletionGateError(message: string): boolean {
  return [
    "أكمل أنشطة التقويم المطلوبة",
    "أكمل جميع الأنشطة القابلة للتصحيح",
    "أجب عن جميع أسئلة الدرس",
    "مستوى إتقانك الحالي",
    "المطلوب 90%",
    "إنهاء الدرس",
  ].some(fragment => message.includes(fragment));
}
