interface StatPanelProps {
  label: string;
  value: string;
  tone?: "default" | "income" | "expense";
}

export function StatPanel({ label, value, tone = "default" }: StatPanelProps) {
  const toneClass =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";

  return (
    <div className="rounded-app border border-line bg-surface p-4">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
