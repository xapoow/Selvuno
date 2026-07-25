import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getDictionary } from "../i18n";
import { Button } from "./ui/Button";

const cookieNoticeKey = "myfinances-cookie-notice-v1";

export function CookieNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const t = getDictionary(typeof navigator === "undefined" ? "en-US" : navigator.language);

  useEffect(() => {
    try {
      setIsVisible(!window.localStorage.getItem(cookieNoticeKey));
    } catch {
      setIsVisible(false);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(cookieNoticeKey, "acknowledged");
    } finally {
      setIsVisible(false);
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="app-surface fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-50 mx-auto max-w-md rounded-app p-4 shadow-[0_18px_48px_rgb(0_0_0/0.18)] md:bottom-6" aria-label={t.cookieNotice.title}>
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-app bg-accent-soft text-accent">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t.cookieNotice.title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted">{t.cookieNotice.body}</p>
          <Button className="mt-3" size="small" onClick={dismiss}>
            {t.cookieNotice.accept}
          </Button>
        </div>
      </div>
    </aside>
  );
}
