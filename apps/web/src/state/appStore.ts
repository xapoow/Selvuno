import { create } from "zustand";

export type AppView = "dashboard" | "add" | "history" | "wallets" | "settings";

interface AppStore {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeView: "dashboard",
  setActiveView: (activeView) => set({ activeView })
}));
