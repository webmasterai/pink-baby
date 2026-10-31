type Props = {
  feature: string;
  details?: string;
};

export function PendingIntegration({ feature, details }: Props) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-pb-border bg-pb-ivory px-5 py-4 text-sm text-pb-charcoal"
    >
      <p className="font-semibold">{feature} — pending integration</p>
      <p className="mt-1 text-pb-muted">
        {details ??
          "This feature needs a real backend connection before it can complete live actions. No fake success states are shown."}
      </p>
    </div>
  );
}
