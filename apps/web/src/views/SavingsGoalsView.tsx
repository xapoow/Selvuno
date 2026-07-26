import { useMemo, useState } from "react";
import type {
  SavingsGoal,
  SavingsGoalContribution,
  SavingsGoalContributionInput,
  SavingsGoalInput,
  Settings,
  Wallet
} from "@myfinances/types";
import { formatMoney } from "@myfinances/utils";
import { CheckCircle2, Edit3, History, Plus, Target, Trash2 } from "lucide-react";
import { SavingsGoalContributionForm } from "../components/SavingsGoalContributionForm";
import { SavingsGoalForm } from "../components/SavingsGoalForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import type { Dictionary } from "../i18n";
import { toCalendarDate } from "../lib/dates";

interface SavingsGoalsViewProps {
  wallets: Wallet[];
  goals: SavingsGoal[];
  contributions: SavingsGoalContribution[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: SavingsGoalInput) => Promise<void>;
  onUpdate: (id: string, input: SavingsGoalInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onContribute: (input: SavingsGoalContributionInput) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
}

function formatCalendarDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`)
  );
}

export function SavingsGoalsView({
  wallets,
  goals,
  contributions,
  settings,
  t,
  onCreate,
  onUpdate,
  onDelete,
  onContribute,
  onDeleteContribution
}: SavingsGoalsViewProps) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<SavingsGoal | null>(null);
  const walletById = useMemo(
    () => new Map(wallets.map((wallet) => [wallet.id, wallet])),
    [wallets]
  );
  const contributionsByGoal = useMemo(() => {
    const grouped = new Map<string, SavingsGoalContribution[]>();
    for (const contribution of contributions) {
      const items = grouped.get(contribution.goalId) ?? [];
      items.push(contribution);
      grouped.set(contribution.goalId, items);
    }
    return grouped;
  }, [contributions]);
  const today = toCalendarDate(new Date());
  const historyContributions = historyGoal
    ? contributionsByGoal.get(historyGoal.id) ?? []
    : [];

  async function removeGoal(goal: SavingsGoal) {
    if (window.confirm(t.goals.confirmDelete)) {
      await onDelete(goal.id);
    }
  }

  async function removeContribution(contribution: SavingsGoalContribution) {
    if (window.confirm(t.goals.confirmDeleteContribution)) {
      await onDeleteContribution(contribution.id);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.goals.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t.goals.description}</p>
        </div>
        <Button size="icon" aria-label={t.goals.add} onClick={() => setCreating(true)}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {goals.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const wallet = walletById.get(goal.walletId);
            const goalContributions = contributionsByGoal.get(goal.id) ?? [];
            const savedMinor = goalContributions.reduce(
              (sum, contribution) => sum + contribution.amountMinor,
              0
            );
            const remainingMinor = Math.max(goal.targetAmountMinor - savedMinor, 0);
            const rawProgress = (savedMinor / goal.targetAmountMinor) * 100;
            const progress = Math.min(Math.round(rawProgress), 100);
            const completed = savedMinor >= goal.targetAmountMinor;
            const overdue = Boolean(goal.targetDate && goal.targetDate < today && !completed);

            return (
              <article
                key={goal.id}
                className="app-surface grid content-start gap-4 rounded-app border-l-4 p-4"
                style={{ borderLeftColor: goal.color }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-foreground">{goal.name}</h3>
                      {completed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-income/12 px-2 py-0.5 text-[11px] font-semibold text-income">
                          <CheckCircle2 className="h-3 w-3" />
                          {t.goals.completed}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {wallet?.name ?? t.goals.walletMissing} · {goal.currency}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={t.common.edit}
                      onClick={() => setEditing(goal)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-expense"
                      aria-label={t.common.delete}
                      onClick={() => void removeGoal(goal)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted">{t.goals.saved}</span>
                    <span className="text-foreground">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${progress}%`, backgroundColor: goal.color }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t.goals.saved}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(savedMinor, goal.currency, settings.locale)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {t.goals.remaining}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(remainingMinor, goal.currency, settings.locale)}
                    </p>
                  </div>
                </div>

                <p className={`text-xs ${overdue ? "font-semibold text-expense" : "text-muted"}`}>
                  {goal.targetDate
                    ? `${overdue ? `${t.goals.overdue} · ` : ""}${formatCalendarDate(
                        goal.targetDate,
                        settings.locale
                      )}`
                    : t.goals.noDeadline}
                </p>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button size="small" onClick={() => setContributing(goal)}>
                    <Plus className="h-4 w-4" />
                    {t.goals.contribute}
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => setHistoryGoal(goal)}>
                    <History className="h-4 w-4" />
                    {t.goals.history}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title={t.goals.empty}
          action={
            <Button size="small" onClick={() => setCreating(true)}>
              {t.goals.add}
            </Button>
          }
        />
      )}

      <BottomSheet open={creating} title={t.goals.newTitle} onClose={() => setCreating(false)}>
        <SavingsGoalForm
          wallets={wallets}
          settings={settings}
          t={t}
          onSubmit={async (input) => {
            await onCreate(input);
            setCreating(false);
          }}
        />
      </BottomSheet>

      <BottomSheet open={Boolean(editing)} title={t.goals.editTitle} onClose={() => setEditing(null)}>
        {editing ? (
          <SavingsGoalForm
            key={editing.id}
            wallets={wallets}
            settings={settings}
            t={t}
            initial={editing}
            onSubmit={async (input) => {
              await onUpdate(editing.id, input);
              setEditing(null);
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={Boolean(contributing)}
        title={t.goals.contributionTitle}
        onClose={() => setContributing(null)}
      >
        {contributing ? (
          <SavingsGoalContributionForm
            key={contributing.id}
            goal={contributing}
            settings={settings}
            t={t}
            onSubmit={async (input) => {
              await onContribute(input);
              setContributing(null);
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={Boolean(historyGoal)}
        title={t.goals.history}
        onClose={() => setHistoryGoal(null)}
      >
        {historyContributions.length ? (
          <div className="grid max-h-[min(70dvh,34rem)] gap-2 overflow-y-auto pr-1">
            {historyContributions.map((contribution) => (
              <article
                key={contribution.id}
                className="app-control grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-app p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    +{formatMoney(
                      contribution.amountMinor,
                      historyGoal?.currency ?? settings.currency,
                      settings.locale
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {new Intl.DateTimeFormat(settings.locale, { dateStyle: "medium" }).format(
                      new Date(contribution.contributionDate)
                    )}
                    {contribution.note ? ` · ${contribution.note}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-expense"
                  aria-label={t.common.delete}
                  onClick={() => void removeContribution(contribution)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={History} title={t.goals.noContributions} />
        )}
      </BottomSheet>
    </div>
  );
}
