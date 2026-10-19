"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Inbox, RefreshCw, ShieldCheck } from "lucide-react";

type Status = "new" | "in_progress" | "resolved";
type Ticket = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  user_role: string;
  category: string;
  subject: string;
  message: string;
  status: Status;
  admin_note: string;
};
const labels: Record<Status, string> = {
  new: "جديد", in_progress: "قيد المتابعة", resolved: "تمت المعالجة",
};
const categoryLabels: Record<string, string> = {
  general: "استفسار عام", technical: "دعم فني", account: "الحساب",
  curriculum: "المناهج", teacher: "المعلم", school: "المدرسة",
  privacy: "الخصوصية", suggestion: "شكوى / اقتراح", other: "أخرى",
};

export default function CareAdminPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState("active");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/care", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذّر تحميل الطلبات.");
      setItems(Array.isArray(data.tickets) ? data.tickets : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذّر تحميل الطلبات.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function change(id: string, patch: Partial<Ticket>) {
    setItems((current) => current.map((ticket) => ticket.id === id ? { ...ticket, ...patch } : ticket));
  }

  async function save(ticket: Ticket) {
    setBusyId(ticket.id);
    setError("");
    try {
      const response = await fetch("/api/admin/care", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ticket.id, status: ticket.status, admin_note: ticket.admin_note,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذّر حفظ التغييرات.");
      change(ticket.id, { updated_at: data.ticket.updated_at });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذّر حفظ التغييرات.");
    } finally {
      setBusyId("");
    }
  }

  const displayed = items.filter((ticket) =>
    filter === "all" ? true : filter === "active" ? ticket.status !== "resolved" : ticket.status === filter
  );

  return (
    <main dir="rtl" className="mx-auto max-w-7xl px-4 py-8 text-[#2d413b] sm:px-6">
      <header className="rounded-[2rem] bg-[#123f39] p-7 text-white sm:p-10">
        <p className="flex items-center gap-2 text-sm font-black text-[#f4d58b]"><ShieldCheck size={19} /> لوحة إدارة خاصة</p>
        <h1 className="mt-3 font-arabic-display text-3xl font-black sm:text-4xl">ضاديوم معك — إدارة الطلبات</h1>
        <p className="mt-3 font-arabic-reading text-lg text-[#deede7]">صوتك يُسمَع، ورأيك يصنع الفرق. عالج طلبات المستخدمين وحافظ على خصوصيتها.</p>
        <Link href="/care" className="mt-4 inline-flex rounded-xl border border-white/30 px-4 py-2 text-sm font-bold hover:bg-white/10">عرض صفحة المستخدمين</Link>
      </header>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "active", label: "غير المكتملة" },
            { value: "new", label: "الجديدة" },
            { value: "in_progress", label: "قيد المتابعة" },
            { value: "resolved", label: "تمت المعالجة" },
            { value: "all", label: "الكل" },
          ].map((option) => (
            <button key={option.value} type="button" onClick={() => setFilter(option.value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === option.value ? "bg-[#174f47] text-white" : "border border-[#dacbaa] bg-white text-[#4d645b]"}`}>
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d2c19f] bg-white px-4 py-2 text-sm font-black"><RefreshCw size={16} /> تحديث</button>
      </div>
      <p className="mt-3 text-sm text-[#6d675c]">عدد الطلبات المعروضة: {displayed.length} (أحدث 100 طلب محفوظ).</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">{error}</p>}
      {loading ? <p className="mt-6 text-[#6b6458]">جارٍ تحميل الطلبات...</p> : displayed.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-[#e1d4bb] bg-white p-10 text-center">
          <Inbox className="text-[#174f47]" size={36} /><p className="mt-3 font-bold">لا توجد طلبات في هذا القسم.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {displayed.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl border border-[#e1d4bb] bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#867b6a]">{categoryLabels[ticket.category] ?? ticket.category} · {ticket.user_role}</p>
                  <h2 className="mt-1 text-xl font-black text-[#174f47]">{ticket.subject}</h2>
                  <p className="mt-2 text-sm">{ticket.name} · <a href={`mailto:${ticket.email}`} dir="ltr" className="break-all font-semibold underline">{ticket.email}</a></p>
                  <p className="mt-1 text-xs text-[#7d7161]">{new Date(ticket.created_at).toLocaleString("ar-BH")}</p>
                </div>
                <span className="rounded-lg bg-[#edf3ef] px-3 py-2 text-xs font-black text-[#315e57]">{labels[ticket.status] ?? ticket.status}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-[#faf6ee] p-4 text-sm leading-8">{ticket.message}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-[200px_1fr_auto] md:items-end">
                <label className="text-sm font-bold">حالة الطلب
                  <select value={ticket.status} onChange={(e) => change(ticket.id, { status: e.target.value as Status })}
                    className="mt-2 w-full rounded-xl border border-[#d9ccb1] bg-white px-3 py-3">
                    {Object.entries(labels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold">ملاحظة إدارية خاصة (لا يراها المستخدم)
                  <textarea value={ticket.admin_note} onChange={(e) => change(ticket.id, { admin_note: e.target.value })}
                    maxLength={2000} rows={2} className="mt-2 w-full rounded-xl border border-[#d9ccb1] bg-white px-3 py-3" />
                </label>
                <button type="button" disabled={busyId === ticket.id} onClick={() => void save(ticket)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#174f47] px-5 py-3.5 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={18} /> {busyId === ticket.id ? "جارٍ الحفظ" : "حفظ التحديث"}</button>
              </div>
              <p className="mt-2 break-all text-[10px] text-[#897967]" dir="ltr">{ticket.id}</p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
