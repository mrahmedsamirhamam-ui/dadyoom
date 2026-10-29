"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const key = "dadyoom.ads-consent.v1";
export const AD_CONSENT_CHANGED = "dadyoom-ad-consent-change";

/** Optional opt-in shown only when the server has confirmed an eligible adult-role free account. */
export default function AdConsentPrompt() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    setVisible(false);
    if (pathname.startsWith("/student/") ||
        pathname.startsWith("/lessons/") ||
        pathname.startsWith("/skills/") ||
        pathname.startsWith("/admin/")) return;
    const load = async () => {
      try {
        const response = await fetch("/api/billing/status", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) return;
        const { showAds } = (await response.json()) as { showAds?: boolean };
        if (!active || showAds !== true) return;
        if (window.localStorage.getItem(key) !== null) return;
        setVisible(true);
      } catch {
        // Consent is never inferred or enabled on network/storage failure.
      }
    };
    void load();
    return () => { active = false; };
  }, [pathname]);

  function choose(value: "allow" | "deny") {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage blocked: leave ads disabled.
      setVisible(false);
      return;
    }
    window.dispatchEvent(new Event(AD_CONSENT_CHANGED));
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <section
      dir="rtl"
      role="region"
      aria-label="اختيار الموافقة على الإعلانات"
      className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-5 text-[#123f39] shadow-xl"
    >
      <h2 className="font-extrabold">إعدادات الإعلانات والخصوصية</h2>
      <p className="mt-2 text-sm leading-7">
        عرض الإعلانات اختياري ويتوقف على إعدادات الموقع والتحقق من الاشتراك.
        يمكن رفض الإعلانات دون فقدان الدروس المجانية. لا تظهر إعلانات داخل الدرس أو أثناء الإجابة.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("allow")} className="rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white focus-visible:outline focus-visible:outline-2">أوافق</button>
        <button type="button" onClick={() => choose("deny")} className="rounded-xl border border-slate-300 px-4 py-2 font-bold focus-visible:outline focus-visible:outline-2">لا أوافق</button>
      </div>
    </section>
  );
}
