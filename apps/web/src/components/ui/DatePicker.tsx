import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";

interface DatePickerProps {
  label: string;
  value: string;
  locale: string;
  previousMonthLabel: string;
  nextMonthLabel: string;
  todayLabel: string;
  onChange: (value: string) => void;
}

function fromDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  label,
  value,
  locale,
  previousMonthLabel,
  nextMonthLabel,
  todayLabel,
  onChange
}: DatePickerProps) {
  const selectedDate = fromDateValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2024, 0, 1 + index);
        return new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(date);
      }),
    [locale]
  );
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(visibleMonth);
  const selectedLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
    selectedDate
  );
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const today = toDateValue(new Date());

  function selectDate(day: number) {
    const nextDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    onChange(toDateValue(nextDate));
    setIsOpen(false);
  }

  function showToday() {
    const now = new Date();
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onChange(toDateValue(now));
    setIsOpen(false);
  }

  return (
    <div className="relative grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <button
        type="button"
        className="app-field app-focus flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm text-foreground"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          setIsOpen((open) => !open);
        }}
      >
        <span>{selectedLabel}</span>
        <CalendarDays className="h-4 w-4 text-muted" />
      </button>

      {isOpen ? (
        <div role="dialog" aria-label={label} className="app-surface absolute left-0 right-0 top-[calc(100%+6px)] z-40 rounded-xl p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="app-focus grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-foreground"
              aria-label={previousMonthLabel}
              onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-foreground">{monthLabel}</span>
            <button
              type="button"
              className="app-focus grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-elevated hover:text-foreground"
              aria-label={nextMonthLabel}
              onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
            {weekdayLabels.map((weekday, index) => (
              <span key={`${weekday}-${index}`} className="grid h-8 place-items-center">
                {weekday}
              </span>
            ))}
            {Array.from({ length: startOffset }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const dateValue = toDateValue(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
              const isSelected = dateValue === value;
              const isToday = dateValue === today;
              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    "app-focus grid h-8 place-items-center rounded-lg text-sm font-medium text-foreground",
                    isSelected && "bg-accent text-white shadow-[0_6px_14px_rgb(var(--color-accent)/0.28)]",
                    !isSelected && isToday && "bg-accent-soft text-accent",
                    !isSelected && !isToday && "hover:bg-elevated"
                  )}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <button type="button" className="mt-3 text-sm font-semibold text-accent" onClick={showToday}>
            {todayLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
