import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CircleAlert,
  Clock3,
  Megaphone,
  Sparkles,
  Target,
  TriangleAlert
} from "lucide-react";
import type { Dictionary } from "../i18n";
import { formatNotificationDate, type AppNotification, type AppNotificationKind, type AppNotificationTone } from "../lib/notifications";
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

function NotificationIcon({ tone, kind }: { tone: AppNotificationTone; kind: AppNotificationKind }) {
  const className = "h-5 w-5";
  if (kind === "announcement") return <Megaphone className={className} />;
  if (tone === "update") return <Sparkles className={className} />;
  if (tone === "info") return <Clock3 className={className} />;
  if (tone === "warning") return <TriangleAlert className={className} />;
  if (tone === "danger") return <CircleAlert className={className} />;
  return <Target className={className} />;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  t: Dictionary;
  locale: string;
}

function NotificationMetadata({ notification, t, locale }: { notification: AppNotification; t: Dictionary; locale: string }) {
  const date = notification.date ? formatNotificationDate(notification.date, locale) : "";
  return (
    <span className="flex max-w-full flex-wrap items-center justify-start gap-y-1 text-left text-[11px] leading-4 text-muted">
      <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 font-semibold", toneStyles[notification.tone])}>
        {t.notifications.kinds[notification.kind]}
      </span>
      {date || notification.kind !== "reminder" ? <>
        <span aria-hidden="true" className="mx-[5px] shrink-0">·</span>
        {date ? <time className="whitespace-nowrap" dateTime={notification.date}>{date}</time> : <span>{t.notifications.unknownDate}</span>}
      </> : null}
    </span>
  );
}

export function NotificationCenter({ notifications, t, locale }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(readNotificationsKey);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      setReadIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
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
        className="app-focus app-surface relative grid h-11 w-11 place-items-center rounded-xl text-muted transition-colors hover:text-foreground"
        aria-label={`${t.notifications.open}${unreadCount ? `, ${unreadCount} ${t.notifications.unread}` : ""}`}
        onClick={() => {
          setSelected(null);
          setOpen(true);
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <BottomSheet
        open={open}
        title={selected?.title ?? t.notifications.title}
        closeLabel={t.common.close}
        onClose={() => setOpen(false)}
        onExitComplete={() => setSelected(null)}
      >
        {!selected ? <>
        <div className="max-h-[min(68vh,560px)] space-y-2 overflow-y-auto pr-1">
          {notifications.length ? (
            notifications.map((notification) => {
              const isRead = readSet.has(notification.id);
              return (
                  <button
                    key={notification.id}
                    type="button"
                    aria-label={notification.title}
                    className={cn(
                      "app-focus app-control flex w-full gap-3 rounded-xl p-3.5 text-left transition-opacity",
                      isRead && "opacity-60"
                    )}
                    onClick={() => {
                      markAsRead(notification.id);
                      setSelected(notification);
                    }}
                  >
                    <span
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-control",
                        toneStyles[notification.tone]
                      )}
                    >
                      <NotificationIcon tone={notification.tone} kind={notification.kind} />
                    </span>
                    <span className="grid min-w-0 flex-1 content-start gap-1">
                      <NotificationMetadata notification={notification} t={t} locale={locale} />
                      <span className="block text-sm font-semibold text-foreground">
                        {notification.title}
                      </span>
                      <span className="block text-sm leading-5 text-muted">
                        {notification.body}
                      </span>
                    </span>
                    {isRead ? <Check className="mt-1 h-4 w-4 shrink-0 text-accent" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="app-control rounded-xl p-5 text-center text-sm text-muted">
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
        </> : null}
        {selected ? (
          <div className="grid gap-4">
            <div className="app-control flex items-start gap-3 rounded-xl p-4">
              <span
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
                  toneStyles[selected.tone]
                )}
              >
                <NotificationIcon tone={selected.tone} kind={selected.kind} />
              </span>
              <div className="min-w-0 self-center">
                <NotificationMetadata notification={selected} t={t} locale={locale} />
                {selected.kind !== "release" ? <p className="mt-2 text-sm leading-6 text-foreground">{selected.body}</p> : null}
              </div>
            </div>
            {selected.paragraphs?.map((paragraph) => <p key={paragraph} className="text-sm leading-6 text-muted">{paragraph}</p>)}
            {selected.details.length ? (
              <dl className="grid gap-2">
                {selected.details.map((detail) => (
                  <div
                    key={`${detail.label}:${detail.value}`}
                    className="app-control grid gap-1 rounded-lg p-3 sm:grid-cols-[140px_1fr] sm:gap-3"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {detail.label}
                    </dt>
                    <dd className="text-sm leading-5 text-foreground whitespace-pre-line">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSelected(null);
              }}
            >
              {t.notifications.backToNotifications}
            </Button>
          </div>
        ) : null}
      </BottomSheet>
    </>
  );
}
