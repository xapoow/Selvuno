import { cn } from "../lib/cn";
import type { AppView } from "../state/appStore";
import { navigationItems } from "./navigationItems";

interface BottomNavigationProps {
  activeView: AppView;
  labels: Record<AppView, string>;
  onChange: (view: AppView) => void;
}

export function BottomNavigation({ activeView, labels, onChange }: BottomNavigationProps) {
  return (
    <nav className="app-chrome fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
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
                "app-focus grid h-12 place-items-center rounded-control text-[11px] font-medium text-muted outline-none transition-all active:scale-[0.96]",
                isActive ? "app-navigation-active font-semibold" : "hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", isActive && "scale-105")} />
              <span className="tracking-tight">{labels[item.view]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
