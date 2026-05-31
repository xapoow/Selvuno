import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WalletView } from "@myfinances/types";
import { BottomNavigation } from "./components/BottomNavigation";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { WalletSwitcher } from "./components/WalletSwitcher";
import { ErrorScreen } from "./components/ErrorScreen";
import { useAppStore } from "./state/appStore";
import { useFinanceData, useFinanceMutations } from "./state/useFinanceQueries";
import { AddTransactionView } from "./views/AddTransactionView";
import { DashboardView } from "./views/DashboardView";
import { HistoryView } from "./views/HistoryView";
import { SettingsView } from "./views/SettingsView";
import { WalletsView } from "./views/WalletsView";

export function App() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const data = useFinanceData();
  const mutations = useFinanceMutations();

  const settings = data.settings.data;
  const wallets = data.wallets.data ?? [];
  const categories = data.categories.data ?? [];
  const transactions = data.transactions.data ?? [];
  const isLoading =
    data.bootstrap.isLoading || data.settings.isLoading || data.wallets.isLoading || data.categories.isLoading;
  const isError =
    data.bootstrap.isError || data.settings.isError || data.wallets.isError || data.categories.isError;

  useEffect(() => {
    if (!settings) {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const shouldUseDark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", shouldUseDark);
      document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  if (isLoading || !settings) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <div className="h-10 w-10 animate-pulse rounded-app bg-accent" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorScreen
        kind="storage"
        details={[
          data.bootstrap.error instanceof Error ? data.bootstrap.error.message : null,
          data.settings.error instanceof Error ? data.settings.error.message : null,
          data.wallets.error instanceof Error ? data.wallets.error.message : null,
          data.categories.error instanceof Error ? data.categories.error.message : null
        ]
          .filter(Boolean)
          .join("\n")}
      />
    );
  }

  const activeWalletId: WalletView =
    settings.activeWalletId === "all" || wallets.some((wallet) => wallet.id === settings.activeWalletId)
      ? settings.activeWalletId
      : "all";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-background/88 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-3xl gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">MyFinances</p>
              <h1 className="text-2xl font-semibold text-foreground">Budget Tracker</h1>
            </div>
          </div>
          <HeaderNavigation activeView={activeView} onChange={setActiveView} />
          <WalletSwitcher
            wallets={wallets}
            value={activeWalletId}
            onChange={(activeWallet) => void mutations.updateSettings.mutateAsync({ activeWalletId: activeWallet })}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeView === "dashboard" ? (
              <DashboardView
                wallets={wallets}
                categories={categories}
                transactions={transactions}
                settings={settings}
                activeWalletId={activeWalletId}
                onAdd={() => setActiveView("add")}
              />
            ) : null}
            {activeView === "add" ? (
              <AddTransactionView
                wallets={wallets}
                categories={categories}
                settings={{ ...settings, activeWalletId }}
                onSubmit={async (input) => {
                  await mutations.addTransaction.mutateAsync(input);
                }}
              />
            ) : null}
            {activeView === "history" ? (
              <HistoryView
                wallets={wallets}
                categories={categories}
                transactions={transactions}
                settings={settings}
                activeWalletId={activeWalletId}
                onUpdate={async (id, input) => {
                  await mutations.updateTransaction.mutateAsync({ id, input });
                }}
                onDelete={(id) => mutations.deleteTransaction.mutateAsync(id)}
              />
            ) : null}
            {activeView === "wallets" ? (
              <WalletsView
                wallets={wallets}
                transactions={transactions}
                settings={settings}
                onCreate={async (input) => {
                  await mutations.createWallet.mutateAsync(input);
                }}
                onUpdate={async (id, input) => {
                  await mutations.updateWallet.mutateAsync({ id, input });
                }}
                onArchive={(id) => mutations.archiveWallet.mutateAsync(id)}
              />
            ) : null}
            {activeView === "settings" ? (
              <SettingsView
                settings={settings}
                categories={categories}
                onUpdateSettings={async (input) => {
                  await mutations.updateSettings.mutateAsync(input);
                }}
                onCreateCategory={async (input) => {
                  await mutations.createCategory.mutateAsync(input);
                }}
                onUpdateCategory={async (id, input) => {
                  await mutations.updateCategory.mutateAsync({ id, input });
                }}
                onDeleteCategory={(id) => mutations.deleteCategory.mutateAsync(id)}
                onExportBackup={() => mutations.exportBackup.mutateAsync()}
                onImportBackup={async (backup) => {
                  await mutations.importBackup.mutateAsync(backup);
                }}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNavigation activeView={activeView} onChange={setActiveView} />
    </div>
  );
}
