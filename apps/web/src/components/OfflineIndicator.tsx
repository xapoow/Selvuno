import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudOff, Wifi } from "lucide-react";
import type { Dictionary } from "../i18n";

export function OfflineIndicator({ t, mode = "local" }: { t: Dictionary; mode?: "local" | "remote" }) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    let restoredTimer: number | undefined;
    const handleOffline = () => {
      wasOffline.current = true;
      setShowRestored(false);
      setOnline(false);
    };
    const handleOnline = () => {
      setOnline(true);
      if (wasOffline.current) {
        setShowRestored(true);
        restoredTimer = window.setTimeout(() => setShowRestored(false), 2400);
      }
      wasOffline.current = false;
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (restoredTimer) {
        window.clearTimeout(restoredTimer);
      }
    };
  }, []);

  const visible = !online || showRestored;
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          className={`fixed left-1/2 top-[calc(env(safe-area-inset-top)+10px)] z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-softDark ${
            online ? "bg-income" : "bg-warning"
          }`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          {online ? <Wifi className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
          {online ? t.connectivity.online : mode === "remote" ? t.connectivity.offlineRemote : t.connectivity.offline}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
