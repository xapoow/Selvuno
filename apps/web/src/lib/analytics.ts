import type { CalendarDate } from "@myfinances/types";

export type AnalyticsPeriodPreset = "week" | "month" | "year" | "custom";

export interface AnalyticsDateRange {
  from: CalendarDate;
  to: CalendarDate;
}

export interface ResolvedAnalyticsPeriod {
  current: AnalyticsDateRange;
  previous: AnalyticsDateRange;
}

export interface AnalyticsTrendBucket {
  key: string;
  label: string;
  granularity: "day" | "month";
}

function parseCalendarDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

function toUtcCalendarDate(date: Date): CalendarDate {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}` as CalendarDate;
}

function createCalendarDate(year: number, monthIndex: number, day: number): CalendarDate {
  return toUtcCalendarDate(new Date(Date.UTC(year, monthIndex, day, 12)));
}

export function addCalendarDays(value: CalendarDate, amount: number): CalendarDate {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return toUtcCalendarDate(date);
}

export function calendarDateInTimeZone(date: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? String(date.getUTCFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = parts.find((part) => part.type === "day")?.value ?? String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as CalendarDate;
}

function normalizeRange(from: CalendarDate, to: CalendarDate): AnalyticsDateRange {
  return from <= to ? { from, to } : { from: to, to: from };
}

function previousRangeWithSameLength(range: AnalyticsDateRange): AnalyticsDateRange {
  const length = getAnalyticsRangeLength(range);
  const to = addCalendarDays(range.from, -1);
  return {
    from: addCalendarDays(to, -(length - 1)),
    to
  };
}

export function resolveAnalyticsPeriod({
  preset,
  now,
  timeZone,
  customFrom,
  customTo
}: {
  preset: AnalyticsPeriodPreset;
  now: Date;
  timeZone: string;
  customFrom: CalendarDate;
  customTo: CalendarDate;
}): ResolvedAnalyticsPeriod {
  const today = calendarDateInTimeZone(now, timeZone);
  const todayDate = parseCalendarDate(today);

  if (preset === "week") {
    const mondayOffset = (todayDate.getUTCDay() + 6) % 7;
    const from = addCalendarDays(today, -mondayOffset);
    return {
      current: { from, to: today },
      previous: { from: addCalendarDays(from, -7), to: addCalendarDays(today, -7) }
    };
  }

  if (preset === "month") {
    const year = todayDate.getUTCFullYear();
    const monthIndex = todayDate.getUTCMonth();
    const previousMonthLastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
    return {
      current: {
        from: createCalendarDate(year, monthIndex, 1),
        to: today
      },
      previous: {
        from: createCalendarDate(year, monthIndex - 1, 1),
        to: createCalendarDate(
          year,
          monthIndex - 1,
          Math.min(todayDate.getUTCDate(), previousMonthLastDay)
        )
      }
    };
  }

  if (preset === "year") {
    const year = todayDate.getUTCFullYear();
    const previousYearMonthLastDay = new Date(
      Date.UTC(year - 1, todayDate.getUTCMonth() + 1, 0)
    ).getUTCDate();
    return {
      current: {
        from: createCalendarDate(year, 0, 1),
        to: today
      },
      previous: {
        from: createCalendarDate(year - 1, 0, 1),
        to: createCalendarDate(
          year - 1,
          todayDate.getUTCMonth(),
          Math.min(todayDate.getUTCDate(), previousYearMonthLastDay)
        )
      }
    };
  }

  const current = normalizeRange(customFrom, customTo);
  return {
    current,
    previous: previousRangeWithSameLength(current)
  };
}

export function getAnalyticsRangeLength(range: AnalyticsDateRange): number {
  return Math.round(
    (parseCalendarDate(range.to).getTime() - parseCalendarDate(range.from).getTime()) / 86_400_000
  ) + 1;
}

export function calendarDateIsInRange(value: CalendarDate, range: AnalyticsDateRange): boolean {
  return value >= range.from && value <= range.to;
}

export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

export function formatAnalyticsDateRange(range: AnalyticsDateRange, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
  return `${formatter.format(parseCalendarDate(range.from))} — ${formatter.format(parseCalendarDate(range.to))}`;
}

export function buildAnalyticsTrendBuckets(
  range: AnalyticsDateRange,
  locale: string
): AnalyticsTrendBucket[] {
  const rangeLength = getAnalyticsRangeLength(range);
  if (rangeLength <= 45) {
    return Array.from({ length: rangeLength }, (_, index) => {
      const dateValue = addCalendarDays(range.from, index);
      const date = parseCalendarDate(dateValue);
      return {
        key: dateValue,
        label: new Intl.DateTimeFormat(locale, {
          ...(rangeLength <= 8 ? { weekday: "short" as const } : { day: "numeric" as const, month: "short" as const }),
          timeZone: "UTC"
        }).format(date),
        granularity: "day" as const
      };
    });
  }

  const buckets: AnalyticsTrendBucket[] = [];
  const first = parseCalendarDate(range.from);
  const last = parseCalendarDate(range.to);
  let year = first.getUTCFullYear();
  let monthIndex = first.getUTCMonth();
  while (year < last.getUTCFullYear() || (year === last.getUTCFullYear() && monthIndex <= last.getUTCMonth())) {
    const date = new Date(Date.UTC(year, monthIndex, 1, 12));
    buckets.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat(locale, {
        month: "short",
        ...(first.getUTCFullYear() !== last.getUTCFullYear() ? { year: "2-digit" as const } : {}),
        timeZone: "UTC"
      }).format(date),
      granularity: "month"
    });
    monthIndex += 1;
    if (monthIndex > 11) {
      year += 1;
      monthIndex = 0;
    }
  }
  return buckets;
}
