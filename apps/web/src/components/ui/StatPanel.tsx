import type { LucideIcon } from "lucide-react";

interface StatPanelProps {
  label: string;
  value: string;
  tone?: "default" | "income" | "expense";
  caption?: string;
  icon?: LucideIcon;
}

export function StatPanel({ label, value, tone = "default", caption, icon: Icon }: StatPanelProps) {
  const toneClass =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";

  return (
    <div className="app-surface rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-muted">{label}</p>
        {Icon ? (
          <span className="app-control grid h-8 w-8 place-items-center rounded-lg text-muted">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className={`mt-2 truncate text-2xl font-semibold ${toneClass}`}>{value}</p>
      {caption ? <p className="mt-1 text-xs font-medium text-muted">{caption}</p> : null}
    </div>
  );
}
