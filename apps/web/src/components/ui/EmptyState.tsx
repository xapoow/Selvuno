import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, action }: EmptyStateProps) {
  return (
    <div className="app-surface grid min-h-40 place-items-center rounded-app px-6 py-8 text-center">
      <div className="grid justify-items-center gap-3">
        <span className="app-control grid h-10 w-10 place-items-center rounded-app text-muted">
          <Icon className="h-5 w-5" />
        </span>
        <p className="max-w-56 text-sm font-medium text-muted">{title}</p>
        {action}
      </div>
    </div>
  );
}
