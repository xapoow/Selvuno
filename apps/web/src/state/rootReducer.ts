import { combineReducers } from "@reduxjs/toolkit";
import { financeReducer } from "./financeSlice";
import { uiReducer } from "./uiSlice";
import { exchangeRatesReducer } from "./exchangeRatesSlice";

export const rootReducer = combineReducers({ finance: financeReducer, ui: uiReducer, exchangeRates: exchangeRatesReducer });
export type RootState = ReturnType<typeof rootReducer>;
