import { useEffect } from "react";
import { motion } from "framer-motion";
import type { WalletView } from "@myfinances/types";
import { BottomNavigation } from "./components/BottomNavigation";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { MobileWalletDashboardPager } from "./components/MobileWalletDashboardPager";
import { MobileWalletHistoryPager } from "./components/MobileWalletHistoryPager";
import { MobileWalletsPager } from "./components/MobileWalletsPager";
import { WalletSwitcher } from "./components/WalletSwitcher";
import { ErrorScreen } from "./components/ErrorScreen";
import { getDictionary } from "./i18n";
import { applyRootVisualTheme } from "./lib/colorThemes";
import { useExchangeRates } from "./lib/exchangeRates";
import { useAppStore } from "./state/appStore";
import { useFinanceData, useFinanceMutations } from "./state/useFinanceQueries";
import { AddTransactionView } from "./views/AddTransactionView";
import { DashboardView } from "./views/DashboardView";
import { HistoryView } from "./views/HistoryView";
import { OnboardingView } from "./views/OnboardingView";
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
  const fallbackT = getDictionary(settings?.locale ?? (typeof navigator === "undefined" ? "en-US" : navigator.language));

  useEffect(() => {
    if (!settings) {
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      applyRootVisualTheme(settings.theme, settings.colorTheme);
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [settings]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  const activeWalletId: WalletView =
    settings && (settings.activeWalletId === "all" || wallets.some((wallet) => wallet.id === settings.activeWalletId))
      ? settings.activeWalletId
      : "all";
  const activeWallet = activeWalletId === "all" ? undefined : wallets.find((wallet) => wallet.id === activeWalletId);
  const displayCurrency = settings ? activeWallet?.currency ?? settings.currency : "USD";
  const conversionNeeded = Boolean(
    settings &&
      transactions.some(
        (transaction) =>
          !transaction.deletedAt &&
          (activeWalletId === "all" || transaction.walletId === activeWalletId) &&
          transaction.currency.toUpperCase() !== displayCurrency
      )
  );
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);
  const handleWalletChange = (nextWalletId: WalletView) => {
    void mutations.updateSettings.mutateAsync({ activeWalletId: nextWalletId });
  };
  const addWalletId: WalletView = activeWalletId === "all" ? wallets[0]?.id ?? "all" : activeWalletId;

  if (isError) {
    return (
      <ErrorScreen
        kind="storage"
        copy={fallbackT.errors}
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

  if (isLoading || !settings) {
    return (
      <div className="app-page-bg grid min-h-screen place-items-center px-6 text-foreground">
        <div className="h-10 w-10 animate-pulse rounded-app bg-accent" />
      </div>
    );
  }

  const t = getDictionary(settings.locale);

  if (!settings.onboardingCompleted) {
    return (
      <OnboardingView
        settings={settings}
        wallets={wallets}
        onUpdateSettings={async (input) => mutations.updateSettings.mutateAsync(input)}
        onCreateWallet={(input) => mutations.createWallet.mutateAsync(input)}
        onUpdateWallet={(id, input) => mutations.updateWallet.mutateAsync({ id, input })}
      />
    );
  }

  return (
    <div className="app-page-bg min-h-screen text-foreground">
      <header className="app-chrome sticky top-0 z-30 hidden px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] md:block">
        <div className="mx-auto grid max-w-3xl gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">MyFinances</p>
              <h1 className="text-2xl font-semibold text-foreground">{t.appName}</h1>
            </div>
          </div>
          <HeaderNavigation activeView={activeView} labels={t.nav} onChange={setActiveView} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-[calc(env(safe-area-inset-top)+16px)] md:pt-5">
        <div className={activeView === "add" ? "mb-5" : "mb-5 hidden md:block"}>
          <WalletSwitcher
            wallets={wallets}
            value={activeView === "add" ? addWalletId : activeWalletId}
            label={t.common.wallet}
            allLabel={t.wallets.allWallets}
            allCurrency={settings.currency}
            className="w-full"
            includeAll={activeView !== "add"}
            onChange={handleWalletChange}
          />
        </div>
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeView === "dashboard" ? (
            <>
              <div className="md:hidden">
                <MobileWalletDashboardPager
                  wallets={wallets}
                  categories={categories}
                  transactions={transactions}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  allLabel={t.wallets.allWallets}
                  t={t}
                  onChange={handleWalletChange}
                  onAdd={() => setActiveView("add")}
                />
              </div>
              <div className="hidden md:block">
                <DashboardView
                  wallets={wallets}
                  categories={categories}
                  transactions={transactions}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates.data}
                  isUpdatingExchangeRates={exchangeRates.isFetching && conversionNeeded}
                  hasExchangeRateError={exchangeRates.isError && conversionNeeded}
                  t={t}
                  onAdd={() => setActiveView("add")}
                />
              </div>
            </>
          ) : null}
          {activeView === "add" ? (
            <AddTransactionView
              wallets={wallets}
              categories={categories}
              settings={{ ...settings, activeWalletId: addWalletId }}
              t={t}
              onSubmit={async (input) => {
                await mutations.addTransaction.mutateAsync(input);
              }}
            />
          ) : null}
          {activeView === "history" ? (
            <>
              <div className="md:hidden">
                <MobileWalletHistoryPager
                  wallets={wallets}
                  categories={categories}
                  transactions={transactions}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  allLabel={t.wallets.allWallets}
                  t={t}
                  onChange={handleWalletChange}
                  onUpdate={async (id, input) => {
                    await mutations.updateTransaction.mutateAsync({ id, input });
                  }}
                  onDelete={(id) => mutations.deleteTransaction.mutateAsync(id)}
                />
              </div>
              <div className="hidden md:block">
                <HistoryView
                  wallets={wallets}
                  categories={categories}
                  transactions={transactions}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates.data}
                  t={t}
                  onUpdate={async (id, input) => {
                    await mutations.updateTransaction.mutateAsync({ id, input });
                  }}
                  onDelete={(id) => mutations.deleteTransaction.mutateAsync(id)}
                />
              </div>
            </>
          ) : null}
          {activeView === "wallets" ? (
            <>
              <div className="md:hidden">
                <MobileWalletsPager
                  wallets={wallets}
                  transactions={transactions}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  allLabel={t.wallets.allWallets}
                  t={t}
                  onChange={handleWalletChange}
                  onCreate={async (input) => {
                    await mutations.createWallet.mutateAsync(input);
                  }}
                  onUpdate={async (id, input) => {
                    await mutations.updateWallet.mutateAsync({ id, input });
                  }}
                  onArchive={(id) => mutations.archiveWallet.mutateAsync(id)}
                />
              </div>
              <div className="hidden md:block">
                <WalletsView
                  wallets={wallets}
                  transactions={transactions}
                  settings={settings}
                  t={t}
                  onCreate={async (input) => {
                    await mutations.createWallet.mutateAsync(input);
                  }}
                  onUpdate={async (id, input) => {
                    await mutations.updateWallet.mutateAsync({ id, input });
                  }}
                  onArchive={(id) => mutations.archiveWallet.mutateAsync(id)}
                />
              </div>
            </>
          ) : null}
          {activeView === "settings" ? (
            <SettingsView
              settings={settings}
              categories={categories}
              t={t}
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
      </main>

      <BottomNavigation activeView={activeView} labels={t.nav} onChange={setActiveView} />
    </div>
  );
}
