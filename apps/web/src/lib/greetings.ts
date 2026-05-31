import type { Dictionary } from "../i18n";

type GreetingPeriod = keyof Dictionary["greetings"];

function getHour(date: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone
  }).format(date);
  return Number(value) % 24;
}

function getPeriod(hour: number): GreetingPeriod {
  if (hour < 6) {
    return "night";
  }
  if (hour < 12) {
    return "morning";
  }
  if (hour < 18) {
    return "day";
  }
  return "evening";
}

export function getTimeGreeting(date: Date, timeZone: string, t: Dictionary): string {
  const period = getPeriod(getHour(date, timeZone));
  const greetings = t.greetings[period];
  const daySeed = Math.floor(date.getTime() / 86_400_000);
  return greetings[daySeed % greetings.length];
}
