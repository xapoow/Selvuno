import type { CalendarDate } from "@myfinances/types";

export interface FinancialCalendarMonth {
  year: number;
  monthIndex: number;
  daysInMonth: number;
  leadingEmptyDays: number;
}

export function getFinancialCalendarMonth(month: string): FinancialCalendarMonth {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  const year = Number(match?.[1]);
  const monthIndex = Number(match?.[2]) - 1;

  if (!match || monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid calendar month: ${month}`);
  }

  const firstDay = new Date(Date.UTC(year, monthIndex, 1, 12));
  return {
    year,
    monthIndex,
    daysInMonth: new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate(),
    leadingEmptyDays: (firstDay.getUTCDay() + 6) % 7
  };
}

export function shiftFinancialCalendarMonth(month: string, offset: number): string {
  const { year, monthIndex } = getFinancialCalendarMonth(month);
  const shifted = new Date(Date.UTC(year, monthIndex + offset, 1, 12));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function createFinancialCalendarDate(month: string, day: number): CalendarDate {
  const { year, monthIndex, daysInMonth } = getFinancialCalendarMonth(month);
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth) {
    throw new Error(`Invalid day ${day} for ${month}`);
  }
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` as CalendarDate;
}
