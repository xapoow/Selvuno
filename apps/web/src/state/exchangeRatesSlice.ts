import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { EXCHANGE_RATE_STALE_MS, type ExchangeRateTable } from "../lib/exchangeRateClient";
import { toDataFailure, type DataFailure } from "../data/dataError";
import type { AppServices } from "./services";

interface RateEntry {
  data?: ExchangeRateTable;
  status: "loading" | "ready" | "failed";
  error: DataFailure | null;
}
export interface ExchangeRatesState { byBase: Record<string, RateEntry | undefined> }

export const loadExchangeRates = createAsyncThunk<ExchangeRateTable, string, {
  extra: AppServices;
  state: { exchangeRates: ExchangeRatesState };
  rejectValue: DataFailure;
}>(
  "exchangeRates/load",
  async (base, api) => {
    try {
      const cached = api.extra.exchangeRates.readCached(base);
      if (cached && Date.now() - Date.parse(cached.cachedAt) < EXCHANGE_RATE_STALE_MS) return cached;
      return await api.extra.exchangeRates.fetch(base, api.signal);
    } catch (error) { return api.rejectWithValue(toDataFailure(error)); }
  },
  {
    condition: (base, api) => {
      const current = api.getState().exchangeRates.byBase[base.toUpperCase()];
      return current?.status !== "loading" &&
        !(current?.data && Date.now() - Date.parse(current.data.cachedAt) < EXCHANGE_RATE_STALE_MS);
    }
  }
);

const slice = createSlice({
  name: "exchangeRates",
  initialState: { byBase: {} } as ExchangeRatesState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadExchangeRates.pending, (state, action) => {
      const base = action.meta.arg.toUpperCase();
      state.byBase[base] = { data: state.byBase[base]?.data, status: "loading", error: null };
    }).addCase(loadExchangeRates.fulfilled, (state, action) => {
      state.byBase[action.meta.arg.toUpperCase()] = { data: action.payload, status: "ready", error: null };
    }).addCase(loadExchangeRates.rejected, (state, action) => {
      const base = action.meta.arg.toUpperCase();
      state.byBase[base] = {
        data: state.byBase[base]?.data, status: "failed",
        error: action.payload ?? { code: "rates_error", message: action.error.message ?? "Exchange rates unavailable.", retryable: true }
      };
    });
  }
});
export const exchangeRatesReducer = slice.reducer;
