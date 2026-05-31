import { useQuery } from "@tanstack/react-query";
import { convertMinorBetweenCurrencies } from "@myfinances/utils";

export interface ExchangeRateTable {
  base: string;
  date: string;
  rates: Record<string, number>;
  cachedAt: string;
}

const apiUrl = "https://api.frankfurter.dev/v2/rates";
const cachePrefix = "myfinances.exchangeRates.";

function normalizeCurrency(currency: string): string {
  return currency.toUpperCase();
}

function cacheKey(baseCurrency: string): string {
  return `${cachePrefix}${normalizeCurrency(baseCurrency)}`;
}

function readCachedRates(baseCurrency: string): ExchangeRateTable | undefined {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  try {
    const cached = localStorage.getItem(cacheKey(baseCurrency));
    return cached ? (JSON.parse(cached) as ExchangeRateTable) : undefined;
  } catch {
    return undefined;
  }
}

function writeCachedRates(table: ExchangeRateTable): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(cacheKey(table.base), JSON.stringify(table));
}

async function fetchExchangeRates(baseCurrency: string): Promise<ExchangeRateTable> {
  const base = normalizeCurrency(baseCurrency);
  try {
    const response = await fetch(`${apiUrl}?base=${encodeURIComponent(base)}`);
    if (!response.ok) {
      throw new Error(`Exchange rate request failed: ${response.status}`);
    }
    const payload = (await response.json()) as
      | {
          base?: string;
          date?: string;
          rates?: Record<string, number>;
        }
      | Array<{ base?: string; date?: string; quote?: string; rate?: number }>;
    const normalizedPayload = Array.isArray(payload)
      ? {
          base: payload[0]?.base,
          date: payload[0]?.date,
          rates: Object.fromEntries(
            payload
              .filter((row) => row.quote && typeof row.rate === "number")
              .map((row) => [normalizeCurrency(row.quote!), row.rate!])
          )
        }
      : payload;
    if (!normalizedPayload.rates || !normalizedPayload.date) {
      throw new Error("Exchange rate response is malformed.");
    }
    const table: ExchangeRateTable = {
      base: normalizeCurrency(normalizedPayload.base ?? base),
      date: normalizedPayload.date,
      rates: Object.fromEntries(
        Object.entries(normalizedPayload.rates).map(([currency, rate]) => [normalizeCurrency(currency), rate])
      ),
      cachedAt: new Date().toISOString()
    };
    writeCachedRates(table);
    return table;
  } catch (cause) {
    const cached = readCachedRates(base);
    if (cached) {
      return cached;
    }
    throw cause;
  }
}

export function useExchangeRates(baseCurrency: string, enabled: boolean) {
  const base = normalizeCurrency(baseCurrency);
  return useQuery({
    queryKey: ["exchangeRates", base],
    queryFn: () => fetchExchangeRates(base),
    enabled,
    initialData: () => readCachedRates(base),
    staleTime: 1000 * 60 * 60 * 12,
    retry: 1
  });
}

export function convertMinorToBaseCurrency(
  amountMinor: number,
  fromCurrency: string,
  baseCurrency: string,
  rates?: ExchangeRateTable
): number | null {
  const from = normalizeCurrency(fromCurrency);
  const base = normalizeCurrency(baseCurrency);
  if (from === base) {
    return amountMinor;
  }
  if (!rates || normalizeCurrency(rates.base) !== base) {
    return null;
  }
  const quotePerBase = rates.rates[from];
  if (!quotePerBase) {
    return null;
  }
  return convertMinorBetweenCurrencies(amountMinor, from, base, 1 / quotePerBase);
}
