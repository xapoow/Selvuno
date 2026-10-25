import { useEffect, useMemo } from "react";
import type { AsyncThunkAction } from "@reduxjs/toolkit";
import type { FinanceCommand, FinanceCommandInputs, FinanceCommandResults } from "../data/financeGateway";
import { DataError } from "../data/dataError";
import { financeCommands, loadFinance } from "./financeActions";
import type { FinanceThunkConfig } from "./financeActions";
import { selectFinanceData } from "./financeSelectors";
import { useAppDispatch, useAppSelector } from "./hooks";

export function useFinanceData() {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectFinanceData);
  useEffect(() => {
    void dispatch(loadFinance());
    const refresh = () => { void dispatch(loadFinance({ force: true })); };
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [dispatch]);
  return data;
}

type BoundCommands = {
  [K in FinanceCommand]: (input: FinanceCommandInputs[K]) => Promise<FinanceCommandResults[K]>;
};

export function useFinanceCommands(): BoundCommands {
  const dispatch = useAppDispatch();
  return useMemo(() => {
    function bind<K extends FinanceCommand>(name: K) {
      // Each key has the corresponding input/output type; Object.keys erases that relationship.
      const action = financeCommands[name] as unknown as (
        input: FinanceCommandInputs[K]
      ) => AsyncThunkAction<FinanceCommandResults[K], FinanceCommandInputs[K], FinanceThunkConfig>;
      return async (input: FinanceCommandInputs[K]) => {
        try { return await dispatch(action(input)).unwrap(); }
        catch (failure) {
          if (failure && typeof failure === "object" && "code" in failure && "message" in failure) {
            throw new DataError(failure as ConstructorParameters<typeof DataError>[0]);
          }
          throw failure;
        }
      };
    }
    return Object.fromEntries((Object.keys(financeCommands) as FinanceCommand[]).map((name) => [name, bind(name)])) as BoundCommands;
  }, [dispatch]);
}
