import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppView = "dashboard" | "add" | "history" | "wallets" | "settings";

const uiSlice = createSlice({
  name: "ui",
  initialState: { activeView: "dashboard" as AppView, historySearchRequest: 0 },
  reducers: {
    viewChanged(state, action: PayloadAction<AppView>) { state.activeView = action.payload; },
    historySearchRequested(state) {
      state.activeView = "history";
      state.historySearchRequest += 1;
    }
  }
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
