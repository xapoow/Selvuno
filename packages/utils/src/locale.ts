import type { DateFormatPreference } from "@myfinances/types";

const REGION_CURRENCY: Record<string, string> = {
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  CZ: "CZK",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  IT: "EUR",
  JP: "JPY",
  PL: "PLN",
  RU: "RUB",
  UA: "UAH",
  US: "USD"
};

export interface DefaultLocaleSettings {
  locale: string;
  currency: string;
  dateFormat: DateFormatPreference;
  timeZone: string;
}

export const DEFAULT_CURRENCY = "USD";

export function normalizeLocale(locale?: string): string {
  if (!locale) {
    return "en-US";
  }
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en-US";
  } catch {
    return "en-US";
  }
}

export function inferCurrencyFromLocale(locale?: string): string {
  const normalized = normalizeLocale(locale);
  const region = normalized.split("-").at(-1)?.toUpperCase();
  return (region && REGION_CURRENCY[region]) || "USD";
}

export function detectDefaultLocaleSettings(locale?: string): DefaultLocaleSettings {
  const detectedLocale = normalizeLocale(locale);
  return {
    locale: detectedLocale,
    currency: DEFAULT_CURRENCY,
    dateFormat: "medium",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  };
}

export function formatDate(
  value: string,
  locale: string,
  dateFormat: DateFormatPreference = "medium",
  timeZone?: string
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: dateFormat,
    timeZone
  }).format(new Date(value));
}
