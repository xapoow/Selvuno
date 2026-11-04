import type { SavingsGoal, SavingsGoalContribution, Settings, Wallet, WalletView } from "@myfinances/types";
import { formatMoney } from "@myfinances/utils";
import { ArrowUpRight, Target } from "lucide-react";
import type { Dictionary } from "../i18n";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import { Section } from "./ui/Section";

export function DashboardGoals({ goals, contributions, wallets, activeWalletId, settings, t, onOpen }: {
  goals: SavingsGoal[]; contributions: SavingsGoalContribution[]; wallets: Wallet[];
  activeWalletId: WalletView; settings: Settings; t: Dictionary; onOpen: () => void;
}) {
  const activeWalletIds = new Set(wallets.filter((wallet) => !wallet.deletedAt && !wallet.archivedAt).map((wallet) => wallet.id));
  const visible = goals.filter((goal) => !goal.deletedAt && activeWalletIds.has(goal.walletId) &&
    (activeWalletId === "all" || goal.walletId === activeWalletId)).slice(0, 3);

  return <Section title={t.homeLayout.blocks.goals.title} action={
    <button type="button" onClick={onOpen} className="app-focus inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent">
      {t.homeLayout.openGoals}<ArrowUpRight className="h-3.5 w-3.5" />
    </button>
  }>
    {visible.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((goal) => {
        const hidden = shouldHideWalletAmounts(settings, wallets.find((wallet) => wallet.id === goal.walletId));
        const saved = contributions.filter((item) => item.goalId === goal.id && !item.deletedAt).reduce((sum, item) => sum + item.amountMinor, 0);
        const percent = Math.min(100, Math.max(0, Math.round(saved / goal.targetAmountMinor * 100)));
        return <button key={goal.id} type="button" onClick={onOpen} className="app-surface app-focus grid min-w-0 content-start gap-3 rounded-2xl p-4 text-left">
          <span className="flex min-w-0 items-center gap-3"><span className="app-control grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ color: goal.color }}><Target className="h-5 w-5" /></span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{goal.name}</span><span className="text-xs text-muted">{hidden ? "•••" : `${percent}%`}</span></span>
          <span className="text-xs text-muted">{formatMoney(saved, goal.currency, settings.locale, hidden)} / {formatMoney(goal.targetAmountMinor, goal.currency, settings.locale, hidden)}</span>
          <span role="progressbar" aria-label={goal.name} aria-valuemin={hidden ? undefined : 0} aria-valuemax={hidden ? undefined : 100} aria-valuenow={hidden ? undefined : percent} aria-valuetext={hidden ? "•••" : undefined} className="h-1.5 overflow-hidden rounded-full bg-elevated">
            <span className="block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none" style={{ width: hidden ? "0%" : `${percent}%`, backgroundColor: goal.color }} />
          </span>
        </button>;
      })}
    </div> : <button type="button" onClick={onOpen} className="app-surface app-focus flex items-center gap-3 rounded-2xl p-4 text-left text-sm text-muted"><Target className="h-5 w-5 shrink-0" />{t.goals.empty}</button>}
  </Section>;
}
