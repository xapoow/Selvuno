import { createAction } from "@reduxjs/toolkit";
import type { FinanceSnapshot, FinanceResource } from "../data/financeGateway";
import type { DataFailure } from "../data/dataError";

export const financePatchReceived = createAction<Partial<FinanceSnapshot>>("finance/patchReceived");
export const financeRefreshFailed = createAction<{ failure: DataFailure; resources: readonly FinanceResource[] }>("finance/refreshFailed");
