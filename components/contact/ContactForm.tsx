"use client";

import { useState, type FormEvent } from "react";
import { useSiteLanguage } from "@/components/i18n/LanguageProvider";

const categories = [
  { value: "general", ar: "استفسار عام", en: "General question" },
  { value: "technical", ar: "مشكلة تقنية", en: "Technical problem" },
  { value: "account", ar: "تسجيل الدخول والحساب", en: "Login and account" },
  { value: "curriculum", ar: "مشكلة في درس أو منهج", en: "Lesson or curriculum" },
  { value: "teacher", ar: "دعم المعلمين", en: "Teacher support" },
  { value: "school", ar: "المدارس والتعاون", en: "Schools and partnerships" },
  { value: "privacy", ar: "الخصوصية والبيانات", en: "Privacy and data" },
  { value: "suggestion", ar: "اقتراح لتطوير ضاديوم", en: "Suggestion" },
  { value: "other", ar: "موضوع آخر", en: "Other" },
];
const roles = [
  { value: "visitor", ar: "زائر", en: "Visitor" },
  { value: "student", ar: "طالب", en: "Student" },
  { value: "parent", ar: "ولي أمر", en: "Parent" },
  { value: "teacher", ar: "معلم", en: "Teacher" },
  { value: "school", ar: "مدرسة", en: "School" },
  { value: "other", ar: "آخر", en: "Other" },
];
const inputStyle = "mt-2 w-full rounded-xl border border-[#d7c8a8] bg-white px-4 py-3 text-[#173b34] outline-none focus:border-[#174f47] focus:ring-2 focus:ring-[#174f47]/15";

export default function ContactForm({ initialCategory = "technical" }: { initialCategory?: "technical" | "suggestion" }) {
  const { language } = useSiteLanguage();
  const en = language === "en";
  const t = (ar: string, english: string) => en ? english : ar;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: text("name"), email: text("email"), category: text("category"),
          userRole: text("userRole"), subject: text("subject"),
          message: text("message"), pageUrl: text("pageUrl"),
          website: text("website"), consent: data.get("consent") === "on",
        }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; reference?: string };
      if (!response.ok || result.ok !== true || !result.reference) {
        throw new Error(result.error || t("تعذر إرسال الطلب.", "Unable to send the request."));
      }
      setReference(result.reference);
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("حدث خطأ غير متوقع.", "Unexpected error."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-[#ddcfb4] bg-white p-5 shadow-sm sm:p-8" aria-labelledby="contact-form-heading">
      <h2 id="contact-form-heading" className="font-arabic-display text-2xl font-black text-[#123f39]">
        {t("أرسل رسالتك إلى فريق ضاديوم", "Write to the Dadyoom team")}
      </h2>
      <p className="mt-2 text-sm leading-7 text-[#6a6256]">
        {t(
          "يمكن إرسال مشكلة أو استفسار حتى من دون حساب. سجّل بريدًا يمكنك استقبال الرد عليه. لا ترسل كلمة مرور أو رموز تحقق أو بيانات طفل حساسة.",
          "Send a question or problem without an account. Use an email where we can reply. Do not share passwords, verification codes or sensitive child data.",
        )}
      </p>

      {reference ? (
        <div role="status" className="mt-6 rounded-2xl border border-[#b7dbc9] bg-[#edf7f2] p-5 text-[#174f47]">
          <p className="font-black">{t("تم تسجيل رسالتك بنجاح.", "Your message has been recorded.")}</p>
          <p className="mt-2 text-sm">{t("رقم مرجع الطلب:", "Ticket reference:")} <b dir="ltr">{reference}</b></p>
          <p className="mt-1 text-xs">{t("احتفظ بالمرجع عند المتابعة. لا نعد بزمن رد ثابت قبل تفعيل فريق الدعم.", "Keep this reference for follow-up. No response time is guaranteed yet.")}</p>
          <button type="button" onClick={() => setReference("")} className="mt-4 rounded-xl border border-[#174f47] px-4 py-2 text-sm font-bold">
            {t("إرسال رسالة أخرى", "Send another message")}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4" dir={en ? "ltr" : "rtl"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-[#32544b]">
              {t("الاسم", "Your name")} *
              <input name="name" autoComplete="name" required minLength={2} maxLength={100} className={inputStyle} placeholder={t("الاسم الكامل", "Full name")} />
            </label>
            <label className="block text-sm font-bold text-[#32544b]">
              {t("البريد الإلكتروني للرد", "Email for reply")} *
              <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputStyle} placeholder="name@example.com" dir="ltr" />
            </label>
            <label className="block text-sm font-bold text-[#32544b]">
              {t("نوع الطلب", "Request type")} *
              <select name="category" required defaultValue={initialCategory} className={inputStyle}>
                {categories.map(item => <option key={item.value} value={item.value}>{en ? item.en : item.ar}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold text-[#32544b]">
              {t("أنت", "Your role")}
              <select name="userRole" defaultValue="visitor" className={inputStyle}>
                {roles.map(item => <option key={item.value} value={item.value}>{en ? item.en : item.ar}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm font-bold text-[#32544b]">
            {t("عنوان الرسالة", "Subject")} *
            <input name="subject" required minLength={5} maxLength={160} className={inputStyle} placeholder={t("مثال: لا أستطيع تسجيل الدخول", "Example: I cannot log in")} />
          </label>
          <label className="block text-sm font-bold text-[#32544b]">
            {t("وصف المشكلة أو الاستفسار", "Describe your issue or question")} *
            <textarea name="message" required minLength={15} maxLength={4000} rows={6} className={inputStyle}
              placeholder={t("ماذا حدث؟ ما الخطوات التي جربتها؟ وما الصفحة أو الدرس المتأثر؟", "What happened, what did you try, and which page or lesson is affected?")} />
          </label>
          <label className="block text-sm font-bold text-[#32544b]">
            {t("رابط الصفحة المتأثرة (اختياري)", "Affected page URL (optional)")}
            <input name="pageUrl" type="url" maxLength={500} dir="ltr" className={inputStyle} placeholder="https://dadyoom.dpdns.org/..." />
          </label>
          {/* Honeypot: keep outside tab order and out of sight. */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <label className="flex items-start gap-3 text-xs font-semibold leading-7 text-[#655a4e]">
            <input type="checkbox" name="consent" required className="mt-2 accent-[#174f47]" />
            <span>{t("أوافق على استخدام البيانات المقدمة لمعالجة طلبي والرد عليّ وفق سياسة الخصوصية.", "I agree to the use of my details to handle this request and reply, as described in the privacy policy.")}</span>
          </label>
          {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p> : null}
          <button disabled={loading} type="submit" className="w-full rounded-2xl bg-[#174f47] px-6 py-3.5 text-base font-black text-white transition hover:bg-[#123f39] disabled:opacity-60 sm:w-auto">
            {loading ? t("جارٍ تسجيل الرسالة…", "Sending…") : t("إرسال الطلب", "Send request")}
          </button>
        </form>
      )}
    </section>
  );
}
