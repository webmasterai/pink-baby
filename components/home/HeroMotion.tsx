"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { IconChevronRight } from "@/components/icons";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Coordinated hero copy entrance. Image stays outside this tree so it paints promptly.
 */
export function HeroMotion({
  line1,
  line2,
  support,
  cta,
  ctaHref,
}: {
  line1: string;
  line2: string;
  support: string;
  cta: string;
  ctaHref: string;
}) {
  // Start settled for SSR/hydration so copy never vanishes; then play once.
  const [ready, setReady] = useState(true);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf2 = 0;
    // After first paint (image already visible), re-arm a soft entrance.
    const raf1 = requestAnimationFrame(() => {
      setReady(false);
      setPlay(true);
      raf2 = requestAnimationFrame(() => {
        requestAnimationFrame(() => setReady(true));
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div
      className={`pb-hero-copy${play ? " is-play" : ""}${ready ? " is-ready" : ""}`}
    >
      <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-pb-charcoal md:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]">
        <span className="pb-hero-part pb-hero-part-1 block">{line1}</span>
        <span className="pb-hero-part pb-hero-part-2 block text-pb-pink">{line2}</span>
      </h1>
      <p className="pb-hero-part pb-hero-part-3 mt-5 max-w-md whitespace-pre-line text-base leading-relaxed text-pb-charcoal/85 md:text-lg lg:text-[1.125rem]">
        {support}
      </p>
      <Link
        href={ctaHref}
        className="pb-hero-part pb-hero-part-4 pb-btn pb-btn-primary mt-8 text-base"
      >
        {cta}
        <IconChevronRight className="pb-btn-arrow h-4 w-4" />
      </Link>
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={`pb-heading-block mx-auto mb-8 max-w-2xl md:mb-10 ${
        align === "center" ? "text-center" : "text-left"
      }`}
    >
      <h2 className="pb-heading-reveal font-display text-3xl font-extrabold text-pb-charcoal md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="pb-heading-reveal pb-heading-reveal-sub mt-2 text-sm text-pb-muted md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Tiny wrapper so server sections can pass static heading slots into Reveal. */
export function MotionSlot({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
