import type { CalendarDate, RecurrenceFrequency } from "@selvuno/types";

export function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function fromDateInputValue(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return date.toISOString();
}

export function toCalendarDate(date: Date): CalendarDate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as CalendarDate;
}

function parseCalendarDate(value: CalendarDate): { year: number; month: number; day: number } {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function createUtcCalendarDate(year: number, monthIndex: number, day: number): CalendarDate {
  const date = new Date(Date.UTC(year, monthIndex, day));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}` as CalendarDate;
}

export function nextRecurringDate(
  current: CalendarDate,
  startDate: CalendarDate,
  frequency: RecurrenceFrequency
): CalendarDate {
  const currentParts = parseCalendarDate(current);
  const startParts = parseCalendarDate(startDate);

  if (frequency === "daily" || frequency === "weekly") {
    const date = new Date(Date.UTC(currentParts.year, currentParts.month - 1, currentParts.day));
    date.setUTCDate(date.getUTCDate() + (frequency === "daily" ? 1 : 7));
    return createUtcCalendarDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  if (frequency === "monthly") {
    const targetMonth = new Date(Date.UTC(currentParts.year, currentParts.month, 1));
    const day = Math.min(startParts.day, daysInUtcMonth(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth()));
    return createUtcCalendarDate(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth(), day);
  }

  const targetYear = currentParts.year + 1;
  const targetMonthIndex = startParts.month - 1;
  const day = Math.min(startParts.day, daysInUtcMonth(targetYear, targetMonthIndex));
  return createUtcCalendarDate(targetYear, targetMonthIndex, day);
}
