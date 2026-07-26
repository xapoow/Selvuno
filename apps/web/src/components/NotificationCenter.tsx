import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CircleAlert,
  Clock3,
  Sparkles,
  Target,
  TriangleAlert
} from "lucide-react";
import type { Dictionary } from "../i18n";
import type { AppNotification, AppNotificationTone } from "../lib/notifications";
import { cn } from "../lib/cn";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";

const readNotificationsKey = "myfinances:read-notifications:v1";

const toneStyles: Record<AppNotificationTone, string> = {
  update: "bg-accent-soft text-accent",
  info: "bg-accent-soft text-accent",
  warning: "bg-warning/12 text-warning",
  danger: "bg-expense/12 text-expense",
  success: "bg-income/12 text-income"
};

function NotificationIcon({ tone }: { tone: AppNotificationTone }) {
  const className = "h-5 w-5";
  if (tone === "update") return <Sparkles className={className} />;
  if (tone === "info") return <Clock3 className={className} />;
  if (tone === "warning") return <TriangleAlert className={className} />;
  if (tone === "danger") return <CircleAlert className={className} />;
  return <Target className={className} />;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  t: Dictionary;
}

export function NotificationCenter({ notifications, t }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(readNotificationsKey);
      setReadIds(stored ? (JSON.parse(stored) as string[]) : []);
    } catch {
      setReadIds([]);
    }
  }, []);

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = notifications.filter((notification) => !readSet.has(notification.id)).length;

  function saveReadIds(nextIds: string[]) {
    const uniqueIds = [...new Set(nextIds)];
    setReadIds(uniqueIds);
    try {
      window.localStorage.setItem(readNotificationsKey, JSON.stringify(uniqueIds));
    } catch {
      // The badge still updates for the current session when storage is unavailable.
    }
  }

  function markAsRead(id: string) {
    if (!readSet.has(id)) {
      saveReadIds([...readIds, id]);
    }
  }

  function markAllAsRead() {
    saveReadIds([...readIds, ...notifications.map((notification) => notification.id)]);
  }

  return (
    <>
      <button
        type="button"
        className="app-focus app-surface relative grid h-11 w-11 place-items-center rounded-app text-muted transition-colors hover:text-foreground"
        aria-label={`${t.notifications.open}${unreadCount ? `, ${unreadCount} ${t.notifications.unread}` : ""}`}
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <BottomSheet open={open} title={t.notifications.title} onClose={() => setOpen(false)}>
        <div className="max-h-[min(68vh,560px)] space-y-2 overflow-y-auto pr-1">
          {notifications.length ? (
            notifications.map((notification) => {
              const isRead = readSet.has(notification.id);
              return (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "app-focus flex w-full gap-3 rounded-app border border-line/60 bg-elevated p-3 text-left transition-opacity",
                    isRead && "opacity-60"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-app",
                      toneStyles[notification.tone]
                    )}
                  >
                    <NotificationIcon tone={notification.tone} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted">
                      {notification.body}
                    </span>
                  </span>
                  {isRead ? <Check className="mt-1 h-4 w-4 shrink-0 text-accent" /> : null}
                </button>
              );
            })
          ) : (
            <p className="rounded-app border border-line/60 bg-elevated p-5 text-center text-sm text-muted">
              {t.notifications.empty}
            </p>
          )}
        </div>
        {unreadCount ? (
          <Button className="mt-4 w-full" variant="secondary" onClick={markAllAsRead}>
            <Check className="h-4 w-4" />
            {t.notifications.markAllRead}
          </Button>
        ) : null}
      </BottomSheet>
    </>
  );
}
