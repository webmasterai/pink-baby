"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isNearViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  // Anything already in view or within ~1 viewport below paints immediately
  // (no armed-hide) so fast scroll never hits empty opacity-0 space.
  return rect.top < vh * 1.15 && rect.bottom > -64;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay after the element enters view (ms). */
  delayMs?: number;
  /** Soften distance for nested / smaller blocks. */
  distance?: "sm" | "md";
};

/**
 * Soft scroll entrance. Content stays visible without JS and when reduced-motion
 * is on. Hiding only arms after we confirm the node is off-screen (no hydration flash).
 * Plays once per mount.
 */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
  distance = "md",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      queueMicrotask(() => {
        setVisible(true);
        setArmed(false);
      });
      return;
    }

    if (isNearViewport(el)) {
      // Already on screen — show immediately, never hide first.
      queueMicrotask(() => setVisible(true));
      return;
    }

    // Off-screen: arm hide, then observe.
    const arm = requestAnimationFrame(() => setArmed(true));
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px 18% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(arm);
      io.disconnect();
    };
  }, []);

  const style = {
    ...(delayMs ? { "--pb-reveal-delay": `${delayMs}ms` } : {}),
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={[
        "pb-reveal",
        distance === "sm" ? "pb-reveal-sm" : "",
        armed ? "is-armed" : "",
        visible ? "is-visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Max items that receive unique delays (keeps large grids snappy). */
  maxStagger?: number;
  /** Gap between items in ms (50–80). */
  stepMs?: number;
};

/**
 * Parent reveal + bounded child stagger. Children keep their identity;
 * only direct children are staggered.
 */
export function Stagger({
  children,
  className = "",
  maxStagger = 8,
  stepMs = 55,
}: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      queueMicrotask(() => setVisible(true));
      return;
    }

    if (isNearViewport(el)) {
      queueMicrotask(() => setVisible(true));
      return;
    }

    const arm = requestAnimationFrame(() => setArmed(true));
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px 18% 0px", threshold: 0.04 },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(arm);
      io.disconnect();
    };
  }, []);

  const items = Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;
    const i = Math.min(index, maxStagger - 1);
    const el = child as ReactElement<{ className?: string; style?: CSSProperties }>;
    return cloneElement(el, {
      className: ["pb-stagger-item", el.props.className].filter(Boolean).join(" "),
      style: {
        ...el.props.style,
        "--pb-stagger-index": i,
      } as CSSProperties,
    });
  });

  return (
    <div
      ref={ref}
      className={[
        "pb-stagger",
        armed ? "is-armed" : "",
        visible ? "is-visible" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--pb-stagger-step": `${stepMs}ms` } as CSSProperties}
    >
      {items}
    </div>
  );
}
