"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSiteLanguage } from "@/components/i18n/LanguageProvider";

export type CompactNavItem = {
  href: string;
  label: string;
  en?: string;
  icon?: string;
};

type Props = {
  items: readonly CompactNavItem[];
  label?: string;
  enLabel?: string;
  id?: string;
};

/** One accessible navigation control across all public, account and admin pages.
 * Unmounting the panel when closed prevents offscreen links and wide headers.
 */
export default function CompactNavigation({
  items,
  label = "القائمة",
  enLabel = "Menu",
  id = "dadyoom-navigation",
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { language } = useSiteLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = `${id}-panel`;

  // Selecting a link closes the panel synchronously; no derived-state effect.

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const name = language === "en" ? enLabel : label;

  return (
    <div ref={rootRef} className="relative z-[60] shrink-0" dir={language === "en" ? "ltr" : "rtl"}>
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={name}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d7c49d] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#123f39] shadow-sm transition hover:bg-[#f3ead7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#123f39]"
      >
        <span aria-hidden="true" className="text-xl leading-none">{open ? "×" : "☰"}</span>
        <span>{name}</span>
      </button>
      {open ? (
        <nav
          id={panelId}
          aria-label={name}
          className="absolute top-full z-[70] mt-2 max-h-[min(72dvh,36rem)] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-[#d7c49d] bg-[#fffdf8] p-2 shadow-2xl shadow-[#123f39]/20 ltr:left-0 rtl:right-0"
        >
          <ul className="grid gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-[#3f493f] transition hover:bg-[#f3ead7] focus-visible:bg-[#f3ead7] aria-[current=page]:bg-[#e6f3ee] aria-[current=page]:text-[#123f39]"
                >
                  {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
                  <span>{language === "en" ? (item.en ?? item.label) : item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
