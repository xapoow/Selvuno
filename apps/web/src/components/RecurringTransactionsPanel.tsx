import { useMemo, useState } from "react";
import type {
  Category,
  RecurringTransaction,
  RecurringTransactionInput,
  Settings,
  Wallet
} from "@myfinances/types";
import { formatSignedMoney } from "@myfinances/utils";
import { CalendarClock, Edit3, Pause, Play, Plus, Repeat2, Trash2 } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { CategoryIcon } from "../lib/icons";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import { BottomSheet } from "./ui/BottomSheet";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";
import { RecurringTransactionForm } from "./RecurringTransactionForm";

interface RecurringTransactionsPanelProps {
  wallet: Wallet;
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: RecurringTransactionInput) => Promise<void>;
  onUpdate: (id: string, input: RecurringTransactionInput) => Promise<void>;
  onSetPaused: (id: string, paused: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatScheduleDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`));
}

export function RecurringTransactionsPanel({
  wallet,
  categories,
  recurringTransactions,
  settings,
  t,
  onCreate,
  onUpdate,
  onSetPaused,
  onDelete
}: RecurringTransactionsPanelProps) {
  const [formState, setFormState] = useState<RecurringTransaction | "new" | null>(null);
  const hideAmounts = shouldHideWalletAmounts(settings, wallet);
  const walletSchedules = useMemo(
    () => recurringTransactions.filter((schedule) => schedule.walletId === wallet.id),
    [recurringTransactions, wallet.id]
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const frequencyLabels = {
    daily: t.recurring.daily,
    weekly: t.recurring.weekly,
    monthly: t.recurring.monthly,
    yearly: t.recurring.yearly
  };
  const editing = formState && formState !== "new" ? formState : undefined;

  async function remove(schedule: RecurringTransaction) {
    if (!window.confirm(t.recurring.confirmDelete)) {
      return;
    }
    await onDelete(schedule.id);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.recurring.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t.recurring.description}</p>
        </div>
        <Button
          size="small"
          aria-label={t.recurring.add}
          onClick={() => setFormState("new")}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t.recurring.add}</span>
        </Button>
      </div>

      <div className="app-control flex items-start gap-3 rounded-xl p-3 text-sm text-muted">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>{t.recurring.openAppHint}</p>
      </div>

      {walletSchedules.length ? (
        <div className="grid gap-3">
          {walletSchedules.map((schedule) => {
            const category = categoryById.get(schedule.categoryId);
            return (
              <article
                key={schedule.id}
                className="app-surface grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: category?.color ?? "#676761" }}
                >
                  <CategoryIcon name={category?.icon ?? "sparkles"} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {getCategoryName(category?.name, t)}
                    </h3>
                    {schedule.paused ? (
                      <span className="rounded-full bg-warning/12 px-2 py-0.5 text-[11px] font-semibold text-warning">
                        {t.recurring.paused}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {frequencyLabels[schedule.frequency]} · {t.recurring.nextRun}{" "}
                    {formatScheduleDate(schedule.nextRunDate, settings.locale)}
                  </p>
                  {schedule.note ? <p className="mt-1 truncate text-xs text-muted">{schedule.note}</p> : null}
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:grid sm:justify-items-end">
                  <p
                    className={`text-sm font-semibold ${
                      schedule.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {formatSignedMoney(
                      schedule.amountMinor,
                      schedule.currency,
                      settings.locale,
                      schedule.type,
                      hideAmounts
                    )}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={schedule.paused ? t.recurring.resume : t.recurring.pause}
                      onClick={() => onSetPaused(schedule.id, !schedule.paused)}
                    >
                      {schedule.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={t.common.edit}
                      onClick={() => setFormState(schedule)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-expense"
                      aria-label={t.common.delete}
                      onClick={() => remove(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Repeat2}
          title={t.recurring.empty}
          action={
            <Button size="small" onClick={() => setFormState("new")}>
              {t.recurring.add}
            </Button>
          }
        />
      )}

      <BottomSheet
        open={Boolean(formState)}
        title={editing ? t.recurring.editTitle : t.recurring.newTitle}
        onClose={() => setFormState(null)}
      >
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto pr-1">
          <RecurringTransactionForm
            key={editing?.id ?? "new"}
            wallet={wallet}
            categories={categories}
            settings={settings}
            t={t}
            initial={editing}
            onSubmit={async (input) => {
              if (editing) {
                await onUpdate(editing.id, input);
              } else {
                await onCreate(input);
              }
              setFormState(null);
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
