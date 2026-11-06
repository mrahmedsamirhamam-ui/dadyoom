"use client";

import { useEffect } from "react";

type Box = Pick<DOMRect, "left" | "right" | "top" | "bottom">;

function overlaps(a: Box, b: Box) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Fixed controls must never block reading or tapping content in the mobile
 * viewport. Geometry remains measurable while visibility:hidden, so the
 * controls reappear automatically whenever there is a safe gap.
 */
export default function HomeFloatingGuard() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".dadyoom-home-page");
    const footer = root?.querySelector<HTMLElement>("[data-dadyoom-home-footer]");
    if (!root) return;

    const html = document.documentElement;
    const footerClass = "dadyoom-home-footer-visible";
    const leftClass = "dadyoom-home-left-obscured";
    const rightClass = "dadyoom-home-right-obscured";
    let footerVisible = false;
    let frame: number | null = null;

    const check = () => {
      frame = null;
      const targets = Array.from(
        root.querySelectorAll<HTMLElement>("a, button, p, h1, h2, h3, h4, li, label"),
      );
      const blockers = [
        [".floating-dock", leftClass],
        ["[data-dad-floating-root]", rightClass],
      ] as const;
      for (const [selector, className] of blockers) {
        const control = document.querySelector<HTMLElement>(selector);
        if (!control) {
          html.classList.remove(className);
          continue;
        }
        const rect = control.getBoundingClientRect();
        const isInViewport = rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
        const collision = isInViewport && targets.some((target) => {
          const t = target.getBoundingClientRect();
          if (t.width === 0 || t.height === 0 || t.bottom <= 0 || t.top >= innerHeight) return false;
          const style = getComputedStyle(target);
          if (style.display === "none" || style.visibility !== "visible") return false;
          return overlaps(rect, t);
        });
        html.classList.toggle(className, collision || footerVisible);
      }
      html.classList.toggle(footerClass, footerVisible);
    };

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(check);
    };
    const observer = footer && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          footerVisible = entry.isIntersecting;
          schedule();
        }, { threshold: 0 })
      : null;
    if (footer && observer) observer.observe(footer);

    // The global PWA and AI controls are loaded dynamically after hydration.
    const changes = new MutationObserver(schedule);
    changes.observe(document.body, { childList: true, subtree: true });
    const initial = window.setTimeout(schedule, 0);
    const late = window.setTimeout(schedule, 1200);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      observer?.disconnect();
      changes.disconnect();
      window.clearTimeout(initial);
      window.clearTimeout(late);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) cancelAnimationFrame(frame);
      html.classList.remove(footerClass, leftClass, rightClass);
    };
  }, []);

  return null;
}
