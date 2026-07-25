import { cn } from "../lib/cn";
import type { AppView } from "../state/appStore";
import { navigationItems } from "./navigationItems";

interface HeaderNavigationProps {
  activeView: AppView;
  labels: Record<AppView, string>;
  onChange: (view: AppView) => void;
}

export function HeaderNavigation({ activeView, labels, onChange }: HeaderNavigationProps) {
  return (
    <nav className="app-control hidden rounded-app p-1 md:grid md:grid-cols-5 md:gap-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => onChange(item.view)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "app-focus inline-flex h-10 items-center justify-center gap-2 rounded-[6px] px-3 text-sm font-medium text-muted active:scale-[0.98]",
              isActive && "app-navigation-active"
            )}
            >
            <Icon className="h-4 w-4" />
            <span>{labels[item.view]}</span>
          </button>
        );
      })}
    </nav>
  );
}
