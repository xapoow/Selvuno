import { useEffect, useState } from "react";
import { HISTORY_FILTER_STORAGE_KEY, persistSavedHistoryFilters, readSavedHistoryFilters, type SavedHistoryFilter } from "../lib/historyFilters";

export function useSavedHistoryFilters() {
  const [saved, setSaved] = useState(readSavedHistoryFilters);
  useEffect(() => {
    const update = (event: StorageEvent) => {
      if (event.key === HISTORY_FILTER_STORAGE_KEY || event.key === null) setSaved(readSavedHistoryFilters());
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);
  function save(next: SavedHistoryFilter[]) {
    persistSavedHistoryFilters(next);
    setSaved(next);
  }
  return { saved, save };
}
