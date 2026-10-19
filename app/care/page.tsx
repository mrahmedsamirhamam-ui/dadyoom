"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, Clock3, HeartHandshake,
  LifeBuoy, Lightbulb, MessageCircle, ShieldCheck, TicketCheck,
} from "lucide-react";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  status: "new" | "in_progress" | "resolved";
  created_at: string;
};
type Form = {
  name: string;
  email: string;
  user_role: string;
  category: string;
  subject: string;
  message: string;
  website: string;
};

const initial: Form = {
  name: "", email: "", user_role: "visitor",
  category: "general", subject: "", message: "", website: "",
};

const categories = [
  { value: "general", label: "استفسار عام" },
  { value: "technical", label: "دعم فني" },
  { value: "account", label: "الحساب وتسجيل الدخول" },
  { value: "curriculum", label: "المناهج والدروس" },
  { value: "teacher", label: "خدمات المعلمين" },
  { value: "school", label: "خدمات المدارس" },
  { value: "privacy", label: "الخصوصية وحماية البيانات" },
  { value: "suggestion", label: "شكوى أو اقتراح" },
  { value: "other", label: "أمر آخر" },
];

const roles = [
  { value: "visitor", label: "زائر" },
  { value: "student", label: "طالب" },
  { value: "child", label: "طفل (بمساعدة ولي الأمر)" },
  { value: "teacher", label: "معلم" },
  { value: "parent", label: "ولي أمر" },
  { value: "school", label: "مدرسة" },
  { value: "other", label: "جهة أخرى" },
];

const statusText = {
  new: "تم الاستلام",
  in_progress: "قيد المتابعة",
  resolved: "تمت المعالجة",
};

export default function DadyoomCarePage() {
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reference, setReference] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadTickets() {
    try {
      const response = await fetch("/api/care", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setAuthenticated(Boolean(data.authenticated));
        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      }
    } catch {
      // Submission remains available even when the history endpoint is unreachable.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTickets(); }, []);

  function setField<K extends keyof Form>(field: K, value: Form[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    setReference("");

    try {
      const response = await fetch("/api/care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? "تعذّر إرسال طلبك. يرجى المحاولة لاحقًا.");
      } else {
        setSuccess("استلمنا رسالتك. نشكرك على مساعدتنا في جعل ضاديوم أفضل.");
        setReference(data.id ?? "");
        setForm((current) => ({
          ...initial, name: current.name, email: current.email,
          user_role: current.user_role,
        }));
        if (authenticated) void loadTickets();
      }
    } catch {
      setError("تعذّر الاتصال بالخدمة. تحقق من الإنترنت وأعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-[#d8cbaa] bg-white px-4 py-3 text-base text-[#273e39] outline-none transition focus:border-[#174f47] focus:ring-2 focus:ring-[#174f47]/15";

  return (
    <main dir="rtl" className="min-h-screen bg-[#fffaf0] text-[#2b3c36]">
      <header className="border-b border-[#e8dcc5] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="font-arabic-display text-2xl font-black text-[#174f47]">ضاديوم <span className="text-sm text-[#a8782f]">Dadyoom</span></Link>
          <div className="flex items-center gap-2">
            <Link href="/how-to-use" className="rounded-xl px-3 py-2 text-sm font-bold text-[#315e57] hover:bg-[#edf4f0]">دليل الاستخدام</Link>
            <Link href="/" className="inline-flex items-center gap-1 rounded-xl bg-[#174f47] px-4 py-2.5 text-sm font-black text-white"><ArrowRight size={16} /> الرئيسية</Link>
          </div>
        </div>
      </header>

      <section className="bg-[#123f39] px-4 py-12 text-center text-white sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center">
          <div className="rounded-2xl border border-[#e5cc8c]/30 bg-white/10 p-4"><HeartHandshake size={38} className="text-[#f7d68a]" /></div>
          <p className="mt-5 text-sm font-black tracking-wide text-[#f2d995]">Dadyoom Care</p>
          <h1 className="mt-2 font-arabic-display text-4xl font-black sm:text-5xl">ضاديوم معك</h1>
          <p className="mt-4 font-arabic-reading text-xl font-black text-[#f5d48b] sm:text-2xl">صوتك يُسمَع، ورأيك يصنع الفرق</p>
          <p className="mt-4 max-w-2xl font-arabic-reading text-base leading-8 text-[#e2eee8]">نستقبل استفساراتك وشكاواك ومقترحاتك، ونتابع ما تطرحه بكل اهتمام. شاركنا ما يساعدك على تعلّم العربية وتعليمها بصورة أفضل.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <section className="grid gap-3 sm:grid-cols-3" aria-label="كيف نخدمك">
          {[
            { icon: LifeBuoy, title: "نساعدك", desc: "دعم فني ومساعدة في الحسابات والمناهج." },
            { icon: Lightbulb, title: "نستمع لرأيك", desc: "شكوى أو فكرة تطوير أو تحسين." },
            { icon: TicketCheck, title: "نتابع طلبك", desc: "رقم مرجعي وحالة طلب داخل حسابك." },
          ].map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-2xl border border-[#e5d6b7] bg-white p-5 shadow-sm">
              <Icon size={27} className="text-[#174f47]" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#6e695e]">{desc}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_.85fr]">
          <section className="rounded-[2rem] border border-[#e2d5b8] bg-white p-5 shadow-sm sm:p-8" aria-labelledby="care-form-title">
            <h2 id="care-form-title" className="font-arabic-display text-2xl font-black text-[#174f47]">أرسل إلى فريق ضاديوم</h2>
            <p className="mt-2 text-sm leading-7 text-[#736a5f]">سيُخصص لرسالتك رقم متابعة. لا ترسل كلمات مرور أو بيانات صحية أو معلومات خاصة بالأطفال.</p>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-black">الاسم
                  <input required minLength={2} maxLength={100} autoComplete="name" className={fieldClass} value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="اسمك" />
                </label>
                <label className="block text-sm font-black">البريد الإلكتروني للمتابعة
                  <input required type="email" maxLength={254} autoComplete="email" dir="ltr" className={fieldClass} value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="name@example.com" />
                </label>
                <label className="block text-sm font-black">صفة المستخدم
                  <select className={fieldClass} value={form.user_role} onChange={(e) => setField("user_role", e.target.value)}>
                    {roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-black">نوع الطلب
                  <select className={fieldClass} value={form.category} onChange={(e) => setField("category", e.target.value)}>
                    {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-sm font-black">عنوان الطلب
                <input required minLength={5} maxLength={160} className={fieldClass} value={form.subject} onChange={(e) => setField("subject", e.target.value)} placeholder="عنوان مختصر يوضح احتياجك" />
              </label>
              <label className="block text-sm font-black">رسالتك
                <textarea required minLength={15} maxLength={4000} rows={6} className={fieldClass + " resize-y"} value={form.message} onChange={(e) => setField("message", e.target.value)} placeholder="اشرح طلبك أو مقترحك بوضوح..." />
                <span className="mt-1 block text-xs font-medium text-[#8b7c66]">{form.message.length} / 4000 حرف</span>
              </label>

              <div className="hidden" aria-hidden="true">
                <label>اترك هذا الحقل فارغًا <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setField("website", e.target.value)} /></label>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-[#f3f7f3] p-3 text-xs leading-6 text-[#43625b]"><ShieldCheck size={18} className="mt-0.5 shrink-0" /> تُستخدم معلوماتك لمعالجة الطلب والتواصل بشأنه. يجب أن يتواصل الأطفال بمساعدة ولي الأمر أو شخص بالغ مسؤول.</p>

              {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}
              {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
                <span className="flex items-center gap-2"><CheckCircle2 size={20} /> {success}</span>
                {reference && <p className="mt-2 break-all text-xs">رقم المتابعة: <b dir="ltr">{reference}</b></p>}
              </div>}

              <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#174f47] px-6 py-4 text-base font-black text-white transition hover:bg-[#103f39] disabled:cursor-wait disabled:opacity-60">
                {busy ? "جارٍ إرسال الطلب..." : "إرسال الطلب"}
              </button>
            </form>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-[#e2d5b8] bg-[#fffdf7] p-5 shadow-sm sm:p-7">
              <h2 className="flex items-center gap-2 text-xl font-black text-[#174f47]"><MessageCircle size={24} /> طلباتي السابقة</h2>
              <p className="mt-2 text-sm leading-7 text-[#746d60]">تظهر طلباتك هنا عند تسجيل الدخول بالحساب الذي أرسلت منه. تُعرض حالتها دون ملاحظات الإدارة الداخلية.</p>
              {loading ? (
                <p className="mt-5 text-sm text-[#666]">جارٍ التحقق من طلباتك...</p>
              ) : !authenticated ? (
                <div className="mt-5 rounded-xl bg-[#f4ecda] p-4 text-sm leading-7">
                  <p>يمكنك إرسال رسالة بصفتك زائرًا. لمتابعة الطلبات السابقة من داخل المنصة، <Link href="/login" className="font-black text-[#174f47] underline">سجّل الدخول</Link> قبل الإرسال.</p>
                </div>
              ) : tickets.length === 0 ? (
                <p className="mt-5 rounded-xl bg-[#f5f7f3] p-4 text-sm text-[#586d60]">لا توجد طلبات مرتبطة بحسابك حتى الآن.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {tickets.map((ticket) => (
                    <li key={ticket.id} className="rounded-xl border border-[#e3dac7] bg-white p-4">
                      <p className="break-words text-sm font-black">{ticket.subject}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-[#3e675e]"><Clock3 size={14} /> {statusText[ticket.status] ?? "قيد المتابعة"}</p>
                      <p className="mt-2 text-xs text-[#827767]">{new Date(ticket.created_at).toLocaleDateString("ar-BH")}</p>
                      <p className="mt-1 break-all font-mono text-[10px] text-[#948777]">{ticket.id}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="rounded-2xl bg-[#174f47] p-6 text-white">
              <h2 className="text-xl font-black">كل رأي له قيمة</h2>
              <p className="mt-3 font-arabic-reading leading-8 text-[#dfebe5]">نحوّل الملاحظات المتكررة إلى فرص لتحسين تجربة الطالب والمعلم وولي الأمر والمدرسة، مع الحفاظ على خصوصية الجميع.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
