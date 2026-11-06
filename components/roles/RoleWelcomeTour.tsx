"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { WarmPortalRole } from "@/lib/ui/portal-experience";
import { PORTAL_EXPERIENCE } from "@/lib/ui/portal-experience";

// Only a non-personal preference is stored. Never store children, marks,
// auth tokens or individual learning results in client-side tour state.
const tourKey = (role: WarmPortalRole) => `dadyoom:welcome-tour:v1:${role}`;

export default function RoleWelcomeTour({ role }: { role: WarmPortalRole }) {
  const [forceOpen, setForceOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = PORTAL_EXPERIENCE[role].steps;

  // useSyncExternalStore preserves consistent SSR hydration and listens for
  // cross-tab updates without a synchronous setState inside a React effect.
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === tourKey(role)) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("dadyoom:tour-changed", notify);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("dadyoom:tour-changed", notify);
    };
  }, [role]);

  const getSnapshot = useCallback((): "new" | "completed" => {
    try {
      return window.localStorage.getItem(tourKey(role)) === "completed"
        ? "completed" : "new";
    } catch {
      // The tour can always be reopened manually; no storage is required.
      return "completed";
    }
  }, [role]);
  const completed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => "completed" as const,
  );
  const visible = forceOpen || (completed === "new" && !dismissed);

  const finish = () => {
    try {
      window.localStorage.setItem(tourKey(role), "completed");
      window.dispatchEvent(new Event("dadyoom:tour-changed"));
    } catch {
      // Local preference is not a security mechanism or a requirement.
    }
    setDismissed(true);
    setForceOpen(false);
    setStepIndex(0);
  };

  if (!visible) {
    return (
      <div className="mt-3 flex justify-start">
        <button
          type="button"
          onClick={() => { setStepIndex(0); setDismissed(false); setForceOpen(true); }}
          className="min-h-11 rounded-xl border border-[#bfd2cc] bg-white px-4 py-2 text-sm font-semibold text-[#164f47] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20645b]"
        >
          إعادة جولة التعريف
        </button>
      </div>
    );
  }

  const current = steps[stepIndex];
  return (
    <section
      role="region"
      aria-label="جولة التعريف بمساحتك"
      aria-labelledby="dadyoom-welcome-tour-title"
      className="mt-4 rounded-2xl border border-[#cbd9d6] bg-[#fffefa] p-4 text-[#17324d] shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#415a61]">
          جولة قصيرة — الخطوة {stepIndex + 1} من {steps.length}
        </p>
        <button
          type="button"
          onClick={finish}
          className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#395f58] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20645b]"
        >
          تخطّي الجولة
        </button>
      </div>
      <div className="mt-3 flex gap-2" aria-hidden="true">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-[#20645b]" : "bg-[#dfe7e3]"}`}
          />
        ))}
      </div>
      <h2 id="dadyoom-welcome-tour-title" className="mt-4 text-lg font-black">
        {current.title}
      </h2>
      <p className="mt-2 font-arabic-reading text-base leading-8 text-[#405950]">
        {current.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={() => setStepIndex(i => i - 1)}
            className="min-h-11 rounded-xl border border-[#cbd9d6] bg-white px-5 text-sm font-bold text-[#164f47] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#20645b]"
          >
            السابق
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (stepIndex === steps.length - 1) finish();
            else setStepIndex(i => i + 1);
          }}
          className="min-h-11 rounded-xl bg-[#20645b] px-5 text-sm font-bold text-white hover:bg-[#164f47] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17324d]"
        >
          {stepIndex === steps.length - 1 ? "إنهاء الجولة" : "التالي"}
        </button>
      </div>
    </section>
  );
}
