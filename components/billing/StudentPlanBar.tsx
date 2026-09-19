"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StudentPlanBar() {
  const [plan, setPlan] = useState("free");
  const [xp, setXp] = useState(0);

  useEffect(() => {
    void Promise.all([
      fetch("/api/billing/status", { cache: "no-store" }).then((response) =>
        response.json(),
      ),
      fetch("/api/me/xp", { cache: "no-store" }).then((response) =>
        response.json(),
      ),
    ])
      .then(([billing, points]) => {
        setPlan(billing.plan === "plus" ? "plus" : "free");
        setXp(Number(points.xp ?? 0));
      })
      .catch(() => undefined);
  }, []);

  return (
    <div
      dir="rtl"
      className="dadyoom-plan-bar mx-auto flex w-full items-center justify-between gap-3 rounded-2xl border border-[#d9c08b] bg-gradient-to-l from-[#fff7df] to-[#fffdf8] px-4 py-2.5 text-sm shadow-sm"
    >
      <div>
        <b className="text-[#123f39]">
          {plan === "plus" ? "ضاديوم Plus" : "ضاديوم العادي"}
        </b>
        <span className="mx-2 text-[#9b7a3c]">•</span>
        <span className="font-black text-[#7d642f]">
          {xp} نقطة موحّدة
        </span>
      </div>

      <Link
        href="/pricing"
        className="dadyoom-arabic-button shrink-0 rounded-xl px-4 py-2 font-black text-white"
      >
        {plan === "plus" ? "إدارة Plus" : "اكتشف Plus"}
      </Link>
    </div>
  );
}
