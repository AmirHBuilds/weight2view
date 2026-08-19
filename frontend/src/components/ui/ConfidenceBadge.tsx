const LABELS: Record<string, { label: string; className: string }> = {
  verified: { label: "Verified data", className: "bg-teal-dim/20 text-teal border-teal-dim/40" },
  estimated: { label: "Estimated", className: "bg-clay/15 text-clay border-clay/40" },
  demo: { label: "Demo data", className: "bg-paper-dim/15 text-paper-dim border-paper-dim/30" },
};

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cfg = LABELS[confidence] ?? LABELS.demo;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
