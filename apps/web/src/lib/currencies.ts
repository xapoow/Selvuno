export const currencyOptions = ["USD", "PLN", "EUR", "GBP", "UAH", "RUB", "JPY", "CHF", "CAD", "AUD"] as const;

export type CurrencyOption = (typeof currencyOptions)[number];

export const currencySymbols: Record<CurrencyOption, string> = {
  USD: "$",
  PLN: "zł",
  EUR: "€",
  GBP: "£",
  UAH: "₴",
  RUB: "₽",
  JPY: "¥",
  CHF: "₣",
  CAD: "C$",
  AUD: "A$"
};

export function getCurrencyLabel(currency: string): string {
  const normalized = currency.toUpperCase() as CurrencyOption;
  const symbol = currencySymbols[normalized];
  return symbol ? `${symbol} ${normalized}` : normalized;
}
