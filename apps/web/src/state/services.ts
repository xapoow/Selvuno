import type { FinanceGateway } from "../data/financeGateway";
import type { ExchangeRateTable } from "../lib/exchangeRateClient";

export interface ExchangeRateClient {
  readCached(base: string): ExchangeRateTable | undefined;
  fetch(base: string, signal?: AbortSignal): Promise<ExchangeRateTable>;
}

export interface AppServices {
  finance: FinanceGateway;
  exchangeRates: ExchangeRateClient;
  // Serialize persistence + refresh as one operation, including across feature domains.
  // This keeps an older network read from replacing newer state after concurrent writes.
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
}

export function createOperationQueue(): AppServices["runExclusive"] {
  let tail: Promise<unknown> = Promise.resolve();
  return <T,>(operation: () => Promise<T>) => {
    const next = tail.then(operation);
    tail = next.catch(() => undefined);
    return next;
  };
}
