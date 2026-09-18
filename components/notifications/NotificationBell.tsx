"use client";

import Link from "next/link";

export default function NotificationBell() {
  return (
    <Link
      href="/student/reminders"
      aria-label="التنبيهات والتذكيرات"
      title="التنبيهات"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl transition hover:bg-white/20"
    >
      <span aria-hidden="true">🔔</span>
      <span
        aria-hidden="true"
        className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-teal-700"
      />
    </Link>
  );
}

