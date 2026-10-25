import { convertMinorBetweenCurrencies } from "@myfinances/utils";
import { z } from "zod";
import type { ExchangeRateClient } from "../state/services";

export const exchangeRateTableSchema = z.object({
  base: z.string().length(3), date: z.string(),
  rates: z.record(z.number().positive().finite()), cachedAt: z.string().datetime()
});
export type ExchangeRateTable = z.infer<typeof exchangeRateTableSchema>;
export const EXCHANGE_RATE_STALE_MS = 12 * 60 * 60 * 1000;

function readCachedRates(base: string): ExchangeRateTable | undefined {
  try {
    const cached = localStorage.getItem(`myfinances.exchangeRates.${base.toUpperCase()}`);
    const parsed = cached ? exchangeRateTableSchema.safeParse(JSON.parse(cached)) : null;
    return parsed?.success && parsed.data.base.toUpperCase() === base.toUpperCase() ? parsed.data : undefined;
  } catch { return undefined; }
}

export const exchangeRateClient: ExchangeRateClient = {
  readCached: readCachedRates,
  async fetch(baseCurrency, signal) {
    const base = baseCurrency.toUpperCase();
    try {
      const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`, { signal });
      if (!response.ok) throw new Error(`Exchange rate request failed: ${response.status}`);
      const rows = z.array(z.object({
        base: z.string(), date: z.string(), quote: z.string(), rate: z.number().positive().finite()
      })).min(1).parse(await response.json());
      if (rows.some((row) => row.base.toUpperCase() !== base)) throw new Error("Exchange rate base does not match the request.");
      const table = exchangeRateTableSchema.parse({
        base, date: rows[0].date,
        rates: Object.fromEntries(rows.map((row) => [row.quote.toUpperCase(), row.rate])),
        cachedAt: new Date().toISOString()
      });
      try { localStorage.setItem(`myfinances.exchangeRates.${base}`, JSON.stringify(table)); } catch {
        // Full browser storage must not discard a successful request.
      }
      return table;
    } catch (error) {
      if (signal?.aborted) throw error;
      const cached = readCachedRates(base);
      if (cached) return cached;
      throw error;
    }
  }
};

export function convertMinorToBaseCurrency(
  amountMinor: number, fromCurrency: string, baseCurrency: string, rates?: ExchangeRateTable
): number | null {
  const from = fromCurrency.toUpperCase();
  const base = baseCurrency.toUpperCase();
  if (from === base) return amountMinor;
  if (!rates || rates.base.toUpperCase() !== base || !rates.rates[from]) return null;
  return convertMinorBetweenCurrencies(amountMinor, from, base, 1 / rates.rates[from]);
}
