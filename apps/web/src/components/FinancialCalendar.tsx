import { useMemo, useState } from "react";
import type { CalendarDate, Category, Settings, Transaction, Wallet } from "@myfinances/types";
import { formatMoney, minorToDecimal } from "@myfinances/utils";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getCategoryName, type Dictionary } from "../i18n";
import { calendarDateInTimeZone } from "../lib/analytics";
import { cn } from "../lib/cn";
import {
  createFinancialCalendarDate,
  getFinancialCalendarMonth,
  shiftFinancialCalendarMonth
} from "../lib/financialCalendar";
import { TransactionRow } from "./TransactionRow";
import { Button } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";

export interface FinancialCalendarTransaction {
  transaction: Transaction;
  amountMinor: number;
  currency: string;
  conversionMissing: boolean;
}

interface FinancialCalendarProps {
  wallets: Wallet[];
  categories: Category[];
  items: FinancialCalendarTransaction[];
  settings: Settings;
  displayCurrency: string;
  t: Dictionary;
  onOpen: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

interface DaySummary {
  items: FinancialCalendarTransaction[];
  incomeMinor: number;
  expenseMinor: number;
  conversionMissing: boolean;
}

function emptyDaySummary(): DaySummary {
  return {
    items: [],
    incomeMinor: 0,
    expenseMinor: 0,
    conversionMissing: false
  };
}

export function FinancialCalendar({
  wallets,
  categories,
  items,
  settings,
  displayCurrency,
  t,
  onOpen,
  onEdit,
  onDelete
}: FinancialCalendarProps) {
  const today = calendarDateInTimeZone(new Date(), settings.timeZone);
  const [visibleMonth, setVisibleMonth] = useState(() => today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(today);
  const month = getFinancialCalendarMonth(visibleMonth);
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(settings.locale, { weekday: "narrow" }).format(
          new Date(Date.UTC(2024, 0, 1 + index, 12))
        )
      ),
    [settings.locale]
  );

  const summaries = useMemo(() => {
    const grouped = new Map<CalendarDate, DaySummary>();
    items.forEach((item) => {
      const date = calendarDateInTimeZone(new Date(item.transaction.transactionDate), settings.timeZone);
      if (!date.startsWith(`${visibleMonth}-`)) {
        return;
      }
      const summary = grouped.get(date) ?? emptyDaySummary();
      summary.items.push(item);
      summary.conversionMissing ||= item.conversionMissing;
      if (!item.conversionMissing) {
        if (item.transaction.type === "income") {
          summary.incomeMinor += item.amountMinor;
        } else {
          summary.expenseMinor += item.amountMinor;
        }
      }
      grouped.set(date, summary);
    });

    grouped.forEach((summary) => {
      summary.items.sort(
        (left, right) =>
          Date.parse(right.transaction.transactionDate) - Date.parse(left.transaction.transactionDate)
      );
    });
    return grouped;
  }, [items, settings.timeZone, visibleMonth]);

  const monthSummary = useMemo(
    () =>
      Array.from(summaries.values()).reduce(
        (total, day) => ({
          incomeMinor: total.incomeMinor + day.incomeMinor,
          expenseMinor: total.expenseMinor + day.expenseMinor,
          conversionMissing: total.conversionMissing || day.conversionMissing
        }),
        { incomeMinor: 0, expenseMinor: 0, conversionMissing: false }
      ),
    [summaries]
  );
  const selectedSummary = summaries.get(selectedDate) ?? emptyDaySummary();
  const monthLabel = new Intl.DateTimeFormat(settings.locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(month.year, month.monthIndex, 1, 12)));
  const selectedDateLabel = new Intl.DateTimeFormat(settings.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${selectedDate}T12:00:00Z`));
  const compactAmount = new Intl.NumberFormat(settings.locale, {
    notation: "compact",
    maximumFractionDigits: 1
  });

  function showMonth(nextMonth: string, preferredDate?: CalendarDate) {
    setVisibleMonth(nextMonth);
    setSelectedDate(preferredDate ?? createFinancialCalendarDate(nextMonth, 1));
  }

  return (
    <div className="grid gap-4">
      <section className="app-surface overflow-hidden rounded-2xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.common.previousMonth}
            onClick={() => showMonth(shiftFinancialCalendarMonth(visibleMonth, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 text-center">
            <h3 className="truncate text-base font-semibold capitalize text-foreground">{monthLabel}</h3>
            <button
              type="button"
              className="app-focus mt-0.5 rounded px-1 text-xs font-medium text-accent"
              onClick={() => showMonth(today.slice(0, 7), today)}
            >
              {t.common.today}
            </button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t.common.nextMonth}
            onClick={() => showMonth(shiftFinancialCalendarMonth(visibleMonth, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="my-3 grid grid-cols-3 gap-2">
          <div className="app-control rounded-xl p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t.common.income}</p>
            <p className="mt-1 truncate text-xs font-semibold text-income sm:text-sm">
              {formatMoney(monthSummary.incomeMinor, displayCurrency, settings.locale, settings.hideAmounts)}
            </p>
          </div>
          <div className="app-control rounded-xl p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t.common.expenses}</p>
            <p className="mt-1 truncate text-xs font-semibold text-expense sm:text-sm">
              {formatMoney(monthSummary.expenseMinor, displayCurrency, settings.locale, settings.hideAmounts)}
            </p>
          </div>
          <div className="app-control rounded-xl p-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t.common.balance}</p>
            <p className="mt-1 truncate text-xs font-semibold text-foreground sm:text-sm">
              {formatMoney(
                monthSummary.incomeMinor - monthSummary.expenseMinor,
                displayCurrency,
                settings.locale,
                settings.hideAmounts
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekdayLabels.map((weekday, index) => (
            <span
              key={`${weekday}-${index}`}
              className="grid h-7 place-items-center text-[10px] font-semibold uppercase text-muted"
            >
              {weekday}
            </span>
          ))}
          {Array.from({ length: month.leadingEmptyDays }, (_, index) => (
            <span key={`empty-${index}`} />
          ))}
          {Array.from({ length: month.daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = createFinancialCalendarDate(visibleMonth, day);
            const summary = summaries.get(date);
            const netMinor = (summary?.incomeMinor ?? 0) - (summary?.expenseMinor ?? 0);
            const hasIncome = Boolean(summary?.incomeMinor);
            const hasExpense = Boolean(summary?.expenseMinor);
            const isSelected = date === selectedDate;
            const isToday = date === today;

            return (
              <button
                key={date}
                type="button"
                aria-label={new Intl.DateTimeFormat(settings.locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC"
                }).format(new Date(`${date}T12:00:00Z`))}
                aria-pressed={isSelected}
                className={cn(
                  "app-focus relative flex min-h-14 min-w-0 flex-col items-center rounded-lg border border-transparent px-0.5 py-1 text-foreground sm:min-h-16 sm:px-1",
                  isSelected && "border-accent/45 bg-accent-soft",
                  !isSelected && isToday && "bg-elevated",
                  !isSelected && "hover:bg-elevated/70"
                )}
                onClick={() => setSelectedDate(date)}
              >
                <span className={cn("text-xs font-semibold", isToday && "text-accent")}>{day}</span>
                {summary?.items.length ? (
                  <>
                    <span className="mt-1 flex gap-1" aria-hidden="true">
                      {hasIncome ? <span className="h-1.5 w-1.5 rounded-full bg-income" /> : null}
                      {hasExpense ? <span className="h-1.5 w-1.5 rounded-full bg-expense" /> : null}
                      {summary.conversionMissing ? <span className="h-1.5 w-1.5 rounded-full bg-warning" /> : null}
                    </span>
                    <span
                      className={cn(
                        "mt-auto max-w-full truncate text-[9px] font-semibold sm:text-[10px]",
                        netMinor > 0 && "text-income",
                        netMinor < 0 && "text-expense",
                        netMinor === 0 && "text-muted"
                      )}
                    >
                      {netMinor > 0 ? "+" : netMinor < 0 ? "−" : ""}
                      {settings.hideAmounts
                        ? "••••"
                        : compactAmount.format(Math.abs(minorToDecimal(netMinor, displayCurrency)))}
                    </span>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>

        {monthSummary.conversionMissing ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t.history.calendarMissingRates}
          </p>
        ) : null}
      </section>

      <section className="grid gap-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t.history.calendarSelectedDay}
            </p>
            <h3 className="mt-0.5 text-base font-semibold capitalize text-foreground">{selectedDateLabel}</h3>
          </div>
          {selectedSummary.items.length ? (
            <div className="text-right text-xs text-muted">
              {selectedSummary.incomeMinor ? (
                <span className="mr-2 font-semibold text-income">
                  {settings.hideAmounts
                    ? "••••"
                    : `+${formatMoney(selectedSummary.incomeMinor, displayCurrency, settings.locale)}`}
                </span>
              ) : null}
              {selectedSummary.expenseMinor ? (
                <span className="font-semibold text-expense">
                  {settings.hideAmounts
                    ? "••••"
                    : `−${formatMoney(selectedSummary.expenseMinor, displayCurrency, settings.locale)}`}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {selectedSummary.items.length ? (
          selectedSummary.items.map((item) => (
            <TransactionRow
              key={item.transaction.id}
              transaction={item.transaction}
              category={categories.find((category) => category.id === item.transaction.categoryId)}
              wallet={wallets.find((wallet) => wallet.id === item.transaction.walletId)}
              settings={settings}
              displayAmountMinor={item.amountMinor}
              displayCurrency={item.currency}
              conversionMissing={item.conversionMissing}
              t={t}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        ) : (
          <EmptyState icon={CalendarDays} title={t.history.calendarEmptyDay} />
        )}
      </section>
    </div>
  );
}
