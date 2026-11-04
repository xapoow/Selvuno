import { getCurrencyMinorUnits } from "@myfinances/utils";

export class WalletBalanceChangedError extends Error {
  constructor() { super("Wallet balance changed. Review the updated balance before reconciling."); }
}

export function parseBalanceToMinor(value: string, currency: string): number {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new Error("Invalid balance.");
  const negative = normalized.startsWith("-");
  const [whole, fraction = ""] = normalized.replace(/^-/, "").split(".");
  const units = getCurrencyMinorUnits(currency);
  if (fraction.length > units) throw new Error("Too many decimal places.");
  const minor = Number(`${whole}${fraction.padEnd(units, "0")}`);
  if (!Number.isSafeInteger(minor)) throw new Error("Balance out of range.");
  return negative && minor !== 0 ? -minor : minor;
}
