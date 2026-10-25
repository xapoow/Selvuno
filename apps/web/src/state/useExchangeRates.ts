import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";
import { loadExchangeRates } from "./exchangeRatesSlice";

export function useExchangeRates(baseCurrency: string, enabled: boolean) {
  const base = baseCurrency.toUpperCase();
  const dispatch = useAppDispatch();
  const entry = useAppSelector((state) => state.exchangeRates.byBase[base]);
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => { void dispatch(loadExchangeRates(base)); };
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [base, dispatch, enabled]);
  return { data: entry?.data, isFetching: entry?.status === "loading", isError: entry?.status === "failed" };
}
