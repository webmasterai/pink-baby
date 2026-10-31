import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-pb-border bg-pb-ivory px-6 py-12 text-center">
      <h2 className="font-display text-xl font-bold text-pb-charcoal">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-pb-muted">{description}</p>
      {children}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="pb-btn pb-btn-primary mt-6">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
