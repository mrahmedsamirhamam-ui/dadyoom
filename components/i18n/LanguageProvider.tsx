"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type SiteLanguage = "ar" | "en";
const KEY = "dadyoom_ui_language_v1";
const pages: Record<string, string> = {
  "/": "/en",
  "/curriculum": "/en/curriculum",
  "/learn-arabic": "/en/learn-arabic",
};
type LocaleValue = { language: SiteLanguage; setLanguage: (value: SiteLanguage) => void };
const LocaleContext = createContext<LocaleValue | null>(null);

export function SiteLanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const [language, setCurrent] = useState<SiteLanguage>(
    () => pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar"
  );
  useEffect(() => {
    let cancelled = false;
    const inEnglishRoute = pathname === "/en" || pathname.startsWith("/en/");
    let selected: SiteLanguage = inEnglishRoute ? "en" : "ar";
    if (inEnglishRoute) {
      // Direct visitors from Google should stay in English when opening sign-up.
      try { window.localStorage.setItem(KEY, "en"); } catch { /* Storage is optional. */ }
    } else {
      try { selected = window.localStorage.getItem(KEY) === "en" ? "en" : "ar"; }
      catch { /* Storage is optional. */ }
    }
    queueMicrotask(() => { if (!cancelled) setCurrent(selected); });
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const setLanguage = useCallback((next: SiteLanguage) => {
    try { window.localStorage.setItem(KEY, next); } catch { /* Keep switch usable. */ }
    const current = window.location.pathname;
    const destination = next === "en"
      ? pages[current]
      : Object.entries(pages).find(([, english]) => english === current)?.[0];
    if (destination && destination !== current) {
      window.location.assign(destination + window.location.search + window.location.hash);
      return;
    }
    setCurrent(next);
  }, []);
  return <LocaleContext.Provider value={{ language, setLanguage }}>{children}</LocaleContext.Provider>;
}

export function useSiteLanguage(): LocaleValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("SiteLanguageProvider is required");
  return context;
}

export function LocalizedText({ ar, en }: { ar: string; en: string }) {
  const { language } = useSiteLanguage();
  return <>{language === "en" ? en : ar}</>;
}

export function LanguageSwitcher({ floating = false }: { floating?: boolean }) {
  const { language, setLanguage } = useSiteLanguage();
  return <div role="group" aria-label={language === "en" ? "Interface language" : "لغة الواجهة"}
    className={["inline-flex items-center gap-1 rounded-full border border-[#cdbb96] bg-white/95 p-1 text-xs font-bold text-[#174f47] shadow-md",
      floating ? "fixed bottom-4 left-4 z-[70] shadow-xl sm:bottom-6 sm:left-6" : ""].join(" ")}>
    <button type="button" lang="ar" dir="rtl" aria-pressed={language === "ar"}
      className={["min-h-9 rounded-full px-3", language === "ar" ? "bg-[#123f39] text-white" : "hover:bg-[#f3ead7]"].join(" ")}
      onClick={() => setLanguage("ar")}>العربية</button>
    <button type="button" lang="en" dir="ltr" aria-pressed={language === "en"}
      className={["min-h-9 rounded-full px-3", language === "en" ? "bg-[#123f39] text-white" : "hover:bg-[#f3ead7]"].join(" ")}
      onClick={() => setLanguage("en")}>English</button>
  </div>;
}
