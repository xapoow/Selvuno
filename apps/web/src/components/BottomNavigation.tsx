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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/88 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onChange(item.view)}
              className={cn(
                "grid h-12 place-items-center rounded-app text-[11px] font-medium text-muted transition duration-200 active:scale-[0.98]",
                isActive && "bg-accentSoft text-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{labels[item.view]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
