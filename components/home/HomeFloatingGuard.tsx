"use client";

import { useEffect } from "react";

/**
 * The mobile floating widgets belong outside the content flow. Make them
 * inert as soon as the home footer scrolls into view so they cannot cover links.
 */
export default function HomeFloatingGuard() {
  useEffect(() => {
    const footer = document.querySelector<HTMLElement>("[data-dadyoom-home-footer]");
    if (!footer || typeof IntersectionObserver === "undefined") return;

    const className = "dadyoom-home-footer-visible";
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.classList.toggle(className, entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(footer);

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove(className);
    };
  }, []);

  return null;
}
