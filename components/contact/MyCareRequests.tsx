"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: "new" | "in_progress" | "resolved";
  public_reply: string;
  created_at: string;
};

const statuses: Record<string, string> = {
  new: "تم الاستلام",
  in_progress: "قيد المتابعة",
  resolved: "تمت المعالجة",
};

export default function MyCareRequests() {
  const [authenticated, setAuthenticated] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function refresh() {
    setState("loading");
    try {
      const response = await fetch("/api/care/my", { cache: "no-store" });
      if (!response.ok) throw new Error("unavailable");
      const data = await response.json();
      setAuthenticated(data.authenticated === true);
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitially() {
      try {
        const response = await fetch("/api/care/my", { cache: "no-store" });
        if (!response.ok) throw new Error("unavailable");
        const data = await response.json();
        if (cancelled) return;
        setAuthenticated(data.authenticated === true);
        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }
    void loadInitially();
    return () => { cancelled = true; };
  }, []);

  return (
    <section aria-labelledby="my-care-title" className="mt-7 rounded-[2rem] border border-[#ddcfb4] bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#9d7430]">ضاديوم معك</p>
          <h2 id="my-care-title" className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
            متابعة طلباتي
          </h2>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-xl border border-[#c8b794] px-4 py-2 text-sm font-black text-[#174f47]">
          تحديث
        </button>
      </div>
      <p className="mt-3 text-sm leading-7 text-[#746a5a]">
        متابعة الحالة والردود المخصصة للطلبات المرسلة أثناء تسجيل دخولك، دون كشف ملاحظات الإدارة الداخلية.
      </p>

      {state === "loading" ? (
        <p className="mt-5 text-sm text-[#645d50]">جارٍ تحميل طلباتك...</p>
      ) : state === "error" ? (
        <p role="alert" className="mt-5 text-sm font-bold text-amber-900">تعذّر عرض طلباتك الآن. يمكنك تحديث الصفحة أو المحاولة لاحقًا.</p>
      ) : !authenticated ? (
        <p className="mt-5 rounded-xl bg-[#f7f1e6] p-4 text-sm leading-7">
          <Link href="/login" className="font-black text-[#174f47] underline">سجّل الدخول</Link> قبل إرسال الطلب لتستطيع متابعة حالته داخل حسابك. يمكنك أيضًا الإرسال كزائر مع الاحتفاظ بالمرجع والبريد.
        </p>
      ) : tickets.length === 0 ? (
        <p className="mt-5 rounded-xl bg-[#f7f1e6] p-4 text-sm">لا توجد طلبات مرتبطة بحسابك حتى الآن.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="rounded-xl border border-[#e3d8c2] bg-[#fffefa] p-4">
              <p className="font-black text-[#174f47]">{ticket.subject}</p>
              <p className="mt-2 text-xs font-bold text-[#6a685d]">
                {statuses[ticket.status] ?? "قيد المتابعة"} · {new Date(ticket.created_at).toLocaleDateString("ar-BH")}
              </p>
              <p className="mt-1 font-mono text-[10px] text-[#847766]">#{ticket.id.slice(0, 8).toUpperCase()}</p>
              {ticket.public_reply?.trim() ? (
                <div className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-[#cbe1cd] bg-[#eef8ef] p-4 text-sm leading-7 text-[#1b5749]">
                  <strong>رد فريق ضاديوم:</strong> {ticket.public_reply}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
