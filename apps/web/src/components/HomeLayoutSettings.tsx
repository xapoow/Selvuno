import { useEffect, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { ArrowDown, ArrowUp, GripVertical, LoaderCircle, RotateCcw } from "lucide-react";
import type { DashboardBlockId, DashboardLayout, Settings, SettingsUpdate } from "@selvuno/types";
import type { Dictionary } from "../i18n";
import { moveDashboardBlock, normalizeDashboardLayout } from "../lib/dashboardLayout";
import { Button } from "./ui/Button";
import { Switch } from "./ui/Switch";

function HomeLayoutRow({ id, checked, index, length, busy, t, onToggle, onMove, onDragEnd }: {
  id: DashboardBlockId; checked: boolean; index: number; length: number; busy: boolean; t: Dictionary;
  onToggle: (checked: boolean) => void; onMove: (offset: -1 | 1) => void; onDragEnd: () => void;
}) {
  const drag = useDragControls();
  return <Reorder.Item value={id} dragListener={false} dragControls={drag} onDragEnd={onDragEnd} className="app-control relative flex min-w-0 items-center gap-2 rounded-xl p-3">
    <button type="button" disabled={busy} className="app-focus grid h-11 w-7 shrink-0 touch-none place-items-center rounded-lg text-muted disabled:opacity-40"
      aria-label={`${t.homeLayout.drag}: ${t.homeLayout.blocks[id].title}`} onPointerDown={(event) => { if (!busy) drag.start(event); }}
      onKeyDown={(event) => { if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); onMove(event.key === "ArrowUp" ? -1 : 1); } }}>
      <GripVertical className="h-4 w-4" />
    </button>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{t.homeLayout.blocks[id].title}</span><span className="mt-1 block text-xs leading-5 text-muted">{t.homeLayout.blocks[id].hint}</span></span>
    <Switch checked={checked} label={t.homeLayout.blocks[id].title} disabled={busy} onClick={() => onToggle(!checked)} />
    <span className="grid shrink-0 gap-1">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={busy || index === 0} aria-label={`${t.homeLayout.up}: ${t.homeLayout.blocks[id].title}`} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={busy || index === length - 1} aria-label={`${t.homeLayout.down}: ${t.homeLayout.blocks[id].title}`} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></Button>
    </span>
  </Reorder.Item>;
}

export function HomeLayoutSettings({ settings, t, onUpdateSettings }: {
  settings: Settings; t: Dictionary; onUpdateSettings: (update: SettingsUpdate) => Promise<void>;
}) {
  const [layout, setLayout] = useState(() => normalizeDashboardLayout(settings.dashboardLayout));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const draft = useRef(layout);
  const persisted = useRef(layout);
  const saving = useRef(false);
  useEffect(() => {
    const next = normalizeDashboardLayout(settings.dashboardLayout);
    persisted.current = next;
    if (!saving.current) { draft.current = next; setLayout(next); }
  }, [settings.dashboardLayout]);

  async function save(next: DashboardLayout, enableInsights = false) {
    if (saving.current) return;
    if (!enableInsights && JSON.stringify(next) === JSON.stringify(persisted.current)) return;
    const previous = persisted.current;
    saving.current = true;
    setBusy(true);
    setFailed(false);
    draft.current = next;
    setLayout(next);
    try {
      await onUpdateSettings({ dashboardLayout: next, ...(enableInsights ? { smartInsightsEnabled: true } : {}) });
      persisted.current = next;
    } catch {
      draft.current = previous;
      setLayout(previous);
      setFailed(true);
    } finally { saving.current = false; setBusy(false); }
  }

  return <div className="app-surface grid gap-4 rounded-2xl p-4">
    <p className="text-sm leading-6 text-muted">{t.homeLayout.intro}</p>
    <p className="text-xs leading-5 text-muted">{t.homeLayout.walletHint}</p>
    <Reorder.Group axis="y" values={layout.order} onReorder={(order: DashboardBlockId[]) => {
      if (saving.current) return;
      const next = { ...draft.current, order };
      draft.current = next;
      setLayout(next);
    }} className="grid gap-2" aria-label={t.homeLayout.title}>
      {layout.order.map((id, index) => <HomeLayoutRow key={id} id={id} index={index} length={layout.order.length} busy={busy} t={t}
        checked={!layout.hidden.includes(id) && (id !== "insights" || settings.smartInsightsEnabled)}
        onToggle={(checked) => {
          const next = { ...layout, hidden: checked ? layout.hidden.filter((item) => item !== id) : [...new Set([...layout.hidden, id])] };
          void save(next, id === "insights" && checked && !settings.smartInsightsEnabled);
        }}
        onMove={(offset) => { void save(moveDashboardBlock(layout, id, offset)); }}
        onDragEnd={() => { void save(draft.current); }} />)}
    </Reorder.Group>
    {failed ? <p role="alert" className="text-sm text-expense">{t.homeLayout.saveError}</p> : null}
    <Button type="button" variant="secondary" disabled={busy} onClick={() => { void save(normalizeDashboardLayout()); }}>
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}{t.homeLayout.reset}
    </Button>
    <p className="text-xs leading-5 text-muted">{t.homeLayout.persistenceHint}</p>
  </div>;
}
