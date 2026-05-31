const MINOR_UNITS: Record<string, number> = {
  BHD: 3,
  JOD: 3,
  JPY: 0,
  KRW: 0,
  KWD: 3,
  PLN: 2,
  RUB: 2,
  UAH: 2,
  USD: 2,
  EUR: 2
};

export function getCurrencyMinorUnits(currency: string): number {
  return MINOR_UNITS[currency.toUpperCase()] ?? 2;
}

export function parseAmountToMinor(value: string, currency: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Amount must be a positive number.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const minorUnits = getCurrencyMinorUnits(currency);
  if (fraction.length > minorUnits) {
    throw new Error(`Amount supports up to ${minorUnits} decimal places.`);
  }

  const paddedFraction = fraction.padEnd(minorUnits, "0");
  const result = Number(`${whole}${paddedFraction || ""}`);
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new Error("Amount is out of range.");
  }

  return result;
}

export function minorToDecimal(amountMinor: number, currency: string): number {
  return amountMinor / 10 ** getCurrencyMinorUnits(currency);
}

export function formatMoney(amountMinor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: getCurrencyMinorUnits(currency)
  }).format(minorToDecimal(amountMinor, currency));
}

export function formatSignedMoney(
  amountMinor: number,
  currency: string,
  locale: string,
  sign: "income" | "expense"
): string {
  const formatted = formatMoney(amountMinor, currency, locale);
  return sign === "income" ? `+${formatted}` : `-${formatted}`;
}
