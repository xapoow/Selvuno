import type { DashboardBlockId, DashboardLayout, Settings } from "@selvuno/types";

export const DASHBOARD_BLOCKS: DashboardBlockId[] = ["summary", "budget", "insights", "cashFlow", "recent", "goals"];
const DEFAULT_HIDDEN: DashboardBlockId[] = ["goals"];

export function normalizeDashboardLayout(value?: DashboardLayout): DashboardLayout {
  const known = (id: unknown): id is DashboardBlockId => DASHBOARD_BLOCKS.includes(id as DashboardBlockId);
  const supplied = Array.isArray(value?.order) ? value.order.filter(known) : [];
  const order = [...new Set([...supplied, ...DASHBOARD_BLOCKS])];
  const hidden = value && Array.isArray(value.hidden) ? value.hidden.filter(known) : DEFAULT_HIDDEN;
  // A newly introduced optional block stays hidden until the user explicitly adds it.
  const hiddenNew = DEFAULT_HIDDEN.filter((id) => !supplied.includes(id));
  return { order, hidden: [...new Set([...hidden, ...hiddenNew])] };
}

export function dashboardRows(settings: Pick<Settings, "dashboardLayout" | "smartInsightsEnabled">): DashboardBlockId[][] {
  const layout = normalizeDashboardLayout(settings.dashboardLayout);
  const visible = layout.order.filter((id) => !layout.hidden.includes(id) && (id !== "insights" || settings.smartInsightsEnabled));
  const rows: DashboardBlockId[][] = [];
  for (let index = 0; index < visible.length; index += 1) {
    const id = visible[index];
    const next = visible[index + 1];
    if ((id === "cashFlow" && next === "recent") || (id === "recent" && next === "cashFlow")) {
      rows.push([id, next]);
      index += 1;
    } else rows.push([id]);
  }
  return rows;
}

export function moveDashboardBlock(layout: DashboardLayout, id: DashboardBlockId, offset: -1 | 1): DashboardLayout {
  const index = layout.order.indexOf(id);
  const next = index + offset;
  if (index < 0 || next < 0 || next >= layout.order.length) return layout;
  const order = [...layout.order];
  [order[index], order[next]] = [order[next], order[index]];
  return { ...layout, order };
}
