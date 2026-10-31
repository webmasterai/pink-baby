import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pb-container py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-pb-pink">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-pb-charcoal">
        Page not found
      </h1>
      <p className="mx-auto mt-3 max-w-md text-pb-muted">
        The page you requested is unavailable. It may have moved or never existed.
      </p>
      <Link href="/" className="pb-btn pb-btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
