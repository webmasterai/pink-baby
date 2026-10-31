"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Applies a one-shot gentle scale settle after first paint.
 * Children (priority Images) still mount immediately for LCP.
 */
export function HeroMedia({ children }: { children: ReactNode }) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (!cancelled) setAnimating(true);
    });
    const done = window.setTimeout(() => {
      if (!cancelled) setAnimating(false);
    }, 1300);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(done);
    };
  }, []);

  return (
    <div
      className={`pb-hero-media absolute inset-0${animating ? " is-animating" : ""}`}
    >
      {children}
    </div>
  );
}
