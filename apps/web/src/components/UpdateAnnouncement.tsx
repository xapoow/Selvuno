import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { appVersion, type Dictionary } from "../i18n";
import { BUILTIN_CHANGELOG } from "../lib/changelog";
import { formatNotificationDate } from "../lib/notifications";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";

const seenReleaseKey = "myfinances:seen-release:v1";

function fillVersion(template: string): string {
  return template.replace("{version}", appVersion);
}

export function UpdateAnnouncement({ t, locale }: { t: Dictionary; locale: string }) {
  const [open, setOpen] = useState(false);
  const releaseDate = BUILTIN_CHANGELOG[locale.startsWith("ru") ? "ru" : "en"].find((item) => item.version === appVersion)?.date;

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(seenReleaseKey) !== appVersion);
    } catch {
      setOpen(false);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(seenReleaseKey, appVersion);
    } finally {
      setOpen(false);
    }
  }

  return (
    <BottomSheet open={open} title={t.updates.title} onClose={dismiss}>
      <div className="overflow-hidden rounded-2xl border border-line/60 bg-elevated">
        <div className="bg-gradient-to-br from-accent-soft via-elevated to-elevated p-5">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-white shadow-[0_10px_30px_rgb(0_0_0/0.12)]">
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {fillVersion(t.updates.eyebrow)}
          </p>
          {releaseDate ? <time dateTime={releaseDate} className="mt-2 block text-xs text-muted">{formatNotificationDate(releaseDate, locale)}</time> : null}
          <p className="mt-2 text-sm leading-6 text-muted">{t.updates.intro}</p>
        </div>
        <ul className="space-y-3 border-t border-line/60 p-5">
          {t.updates.notes.map((note) => (
            <li key={note} className="flex gap-3 text-sm leading-5 text-foreground">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
      <Button className="mt-4 w-full" onClick={dismiss}>
        {t.updates.gotIt}
      </Button>
    </BottomSheet>
  );
}
