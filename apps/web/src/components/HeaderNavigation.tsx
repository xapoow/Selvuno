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
    <nav className="hidden gap-1 md:grid" aria-label="Main navigation">
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
              "app-focus inline-flex h-11 items-center justify-start gap-3 rounded-control px-3.5 text-sm font-medium text-muted outline-none transition-all active:scale-[0.97]",
              isActive ? "app-navigation-active font-semibold" : "hover:bg-elevated/60 hover:text-foreground"
            )}
            >
            <Icon className={cn("h-[18px] w-[18px] transition-transform", isActive && "scale-105")} />
            <span>{labels[item.view]}</span>
          </button>
        );
      })}
    </nav>
  );
}
