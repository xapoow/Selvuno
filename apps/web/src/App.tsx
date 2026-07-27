import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { WalletView } from "@myfinances/types";
import { BottomNavigation } from "./components/BottomNavigation";
import { CookieNotice } from "./components/CookieNotice";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { MobileWalletDashboardPager } from "./components/MobileWalletDashboardPager";
import { MobileWalletHistoryPager } from "./components/MobileWalletHistoryPager";
import { NotificationCenter } from "./components/NotificationCenter";
import { UpdateAnnouncement } from "./components/UpdateAnnouncement";
import { WalletSwitcher } from "./components/WalletSwitcher";
import { ErrorScreen } from "./components/ErrorScreen";
import { getDictionary } from "./i18n";
import { applyRootVisualTheme } from "./lib/colorThemes";
import { useExchangeRates } from "./lib/exchangeRates";
import { buildAppNotifications } from "./lib/notifications";
import { useAppStore } from "./state/appStore";
import { useFinanceData, useFinanceMutations } from "./state/useFinanceQueries";
import { AddTransactionView } from "./views/AddTransactionView";
import { DashboardView } from "./views/DashboardView";
import { HistoryView } from "./views/HistoryView";
import { OnboardingView } from "./views/OnboardingView";
import { SettingsView } from "./views/SettingsView";
import { WalletsHubView } from "./views/WalletsHubView";

export function App() {
  const activeView = useAppStore((state) => state.activeView);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const [walletTransitionDirection, setWalletTransitionDirection] = useState(1);
  const data = useFinanceData();
  const mutations = useFinanceMutations();

  const settings = data.settings.data;
  const wallets = data.wallets.data ?? [];
  const archivedWallets = data.archivedWallets.data ?? [];
  const categories = data.categories.data ?? [];
  const transactions = data.transactions.data ?? [];
  const budgets = data.budgets.data ?? [];
  const recurringTransactions = data.recurringTransactions.data ?? [];
  const savingsGoals = data.savingsGoals.data ?? [];
  const savingsGoalContributions = data.savingsGoalContributions.data ?? [];
  const walletTransfers = data.walletTransfers.data ?? [];
  const isLoading =
    data.bootstrap.isLoading ||
    data.settings.isLoading ||
    data.wallets.isLoading ||
    data.archivedWallets.isLoading ||
    data.categories.isLoading ||
    data.transactions.isLoading ||
    data.budgets.isLoading ||
    data.recurringTransactions.isLoading ||
    data.savingsGoals.isLoading ||
    data.savingsGoalContributions.isLoading ||
    data.walletTransfers.isLoading;
  const isError =
    data.bootstrap.isError ||
    data.settings.isError ||
    data.wallets.isError ||
    data.archivedWallets.isError ||
    data.categories.isError ||
    data.transactions.isError ||
    data.budgets.isError ||
    data.recurringTransactions.isError ||
    data.savingsGoals.isError ||
    data.savingsGoalContributions.isError ||
    data.walletTransfers.isError;
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
      (transactions.some(
        (transaction) =>
          !transaction.deletedAt &&
          (activeWalletId === "all" || transaction.walletId === activeWalletId) &&
          transaction.currency.toUpperCase() !== displayCurrency
      ) ||
        wallets.some(
          (wallet) =>
            !wallet.deletedAt &&
            (activeWalletId === "all" || wallet.id === activeWalletId) &&
            wallet.currency.toUpperCase() !== displayCurrency &&
            wallet.initialBalanceMinor !== 0
        ) ||
        walletTransfers.some(
          (transfer) =>
            !transfer.deletedAt &&
            (((activeWalletId === "all" || transfer.fromWalletId === activeWalletId) &&
              transfer.fromCurrency.toUpperCase() !== displayCurrency) ||
              ((activeWalletId === "all" || transfer.toWalletId === activeWalletId) &&
                transfer.toCurrency.toUpperCase() !== displayCurrency))
        ))
  );
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);
  const handleWalletChange = (nextWalletId: WalletView, direction = 1) => {
    setWalletTransitionDirection(direction);
    void mutations.updateSettings.mutateAsync({ activeWalletId: nextWalletId });
  };
  const addWalletId: WalletView = activeWalletId === "all" ? wallets[0]?.id ?? "all" : activeWalletId;
  const showsWalletContext = activeView === "dashboard" || activeView === "history" || activeView === "add";

  if (isError) {
    return (
      <ErrorScreen
        kind="storage"
        copy={fallbackT.errors}
        details={[
          data.bootstrap.error instanceof Error ? data.bootstrap.error.message : null,
          data.settings.error instanceof Error ? data.settings.error.message : null,
          data.wallets.error instanceof Error ? data.wallets.error.message : null,
          data.archivedWallets.error instanceof Error ? data.archivedWallets.error.message : null,
          data.categories.error instanceof Error ? data.categories.error.message : null,
          data.transactions.error instanceof Error ? data.transactions.error.message : null,
          data.budgets.error instanceof Error ? data.budgets.error.message : null,
          data.recurringTransactions.error instanceof Error ? data.recurringTransactions.error.message : null,
          data.savingsGoals.error instanceof Error ? data.savingsGoals.error.message : null,
          data.savingsGoalContributions.error instanceof Error
            ? data.savingsGoalContributions.error.message
            : null,
          data.walletTransfers.error instanceof Error ? data.walletTransfers.error.message : null
        ]
          .filter(Boolean)
          .join("\n")}
      />
    );
  }

  if (isLoading || !settings) {
    return (
      <div className="app-page-bg grid min-h-dvh place-items-center px-6 text-foreground">
        <div className="h-10 w-10 animate-pulse rounded-app bg-accent" />
      </div>
    );
  }

  const t = getDictionary(settings.locale);
  const notifications = buildAppNotifications({
    settings,
    categories,
    transactions,
    budgets,
    recurringTransactions,
    savingsGoals,
    savingsGoalContributions,
    t
  });

  if (!settings.onboardingCompleted) {
    return (
      <>
        <OnboardingView
          settings={settings}
          wallets={wallets}
          onUpdateSettings={async (input) => mutations.updateSettings.mutateAsync(input)}
          onCreateWallet={(input) => mutations.createWallet.mutateAsync(input)}
          onUpdateWallet={(id, input) => mutations.updateWallet.mutateAsync({ id, input })}
        />
        <CookieNotice />
      </>
    );
  }

  return (
    <div className="app-page-bg min-h-dvh text-foreground md:grid md:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="app-chrome sticky top-0 hidden h-dvh border-r border-line/60 p-4 md:flex md:flex-col">
        <div className="mb-7 px-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">MyFinances</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t.appName}</h1>
        </div>
        <HeaderNavigation activeView={activeView} labels={t.nav} onChange={setActiveView} />
        {showsWalletContext ? (
          <div className="mt-auto rounded-app border border-line/60 bg-elevated/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.common.wallet}</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {activeWallet?.name ?? t.wallets.allWallets}
            </p>
            <p className="mt-0.5 text-xs text-muted">{displayCurrency}</p>
          </div>
        ) : null}
      </aside>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-[calc(env(safe-area-inset-top)+16px)] md:px-8 md:pb-10 md:pt-7 lg:px-10">
        <div className="mb-3 flex justify-end">
          <NotificationCenter notifications={notifications} t={t} />
        </div>
        {showsWalletContext ? (
          <div className={activeView === "add" ? "mb-6" : "mb-6 hidden md:block"}>
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
        ) : null}
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
                  transfers={walletTransfers}
                  budgets={budgets}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  allLabel={t.wallets.allWallets}
                  t={t}
                  onChange={handleWalletChange}
                  onAdd={() => setActiveView("add")}
                  onSetBudget={(input) => mutations.setBudget.mutateAsync(input)}
                />
              </div>
              <div className="hidden overflow-hidden md:block">
                <motion.div
                  key={activeWalletId}
                  initial={{ opacity: 0, x: walletTransitionDirection * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DashboardView
                    wallets={wallets}
                    categories={categories}
                    transactions={transactions}
                    transfers={walletTransfers}
                    budgets={budgets}
                    settings={settings}
                    activeWalletId={activeWalletId}
                    displayCurrency={displayCurrency}
                    exchangeRates={exchangeRates.data}
                    isUpdatingExchangeRates={exchangeRates.isFetching && conversionNeeded}
                    hasExchangeRateError={exchangeRates.isError && conversionNeeded}
                    t={t}
                    onAdd={() => setActiveView("add")}
                    onSetBudget={(input) => mutations.setBudget.mutateAsync(input)}
                  />
                </motion.div>
              </div>
            </>
          ) : null}
          {activeView === "add" ? (
            <AddTransactionView
              wallets={wallets}
              categories={categories}
              recurringTransactions={recurringTransactions}
              transactions={transactions}
              settings={{ ...settings, activeWalletId: addWalletId }}
              t={t}
              onSubmit={async (input) => {
                await mutations.addTransaction.mutateAsync(input);
              }}
              onCreateRecurring={async (input) => {
                await mutations.createRecurringTransaction.mutateAsync(input);
              }}
              onUpdateRecurring={async (id, input) => {
                await mutations.updateRecurringTransaction.mutateAsync({ id, input });
              }}
              onSetRecurringPaused={async (id, paused) => {
                await mutations.setRecurringTransactionPaused.mutateAsync({ id, paused });
              }}
              onDeleteRecurring={async (id) => {
                await mutations.deleteRecurringTransaction.mutateAsync(id);
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
              <div className="hidden overflow-hidden md:block">
                <motion.div
                  key={activeWalletId}
                  initial={{ opacity: 0, x: walletTransitionDirection * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
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
                </motion.div>
              </div>
            </>
          ) : null}
          {activeView === "wallets" ? (
            <WalletsHubView
              wallets={wallets}
              archivedWallets={archivedWallets}
              transactions={transactions}
              goals={savingsGoals}
              contributions={savingsGoalContributions}
              transfers={walletTransfers}
              settings={settings}
              t={t}
              onCreateWallet={async (input) => {
                await mutations.createWallet.mutateAsync(input);
              }}
              onUpdateWallet={async (id, input) => {
                await mutations.updateWallet.mutateAsync({ id, input });
              }}
              onArchiveWallet={(id) => mutations.archiveWallet.mutateAsync(id)}
              onRestoreWallet={async (id) => {
                await mutations.restoreWallet.mutateAsync(id);
              }}
              onCreateGoal={async (input) => {
                await mutations.createSavingsGoal.mutateAsync(input);
              }}
              onUpdateGoal={async (id, input) => {
                await mutations.updateSavingsGoal.mutateAsync({ id, input });
              }}
              onDeleteGoal={(id) => mutations.deleteSavingsGoal.mutateAsync(id)}
              onContribute={async (input) => {
                await mutations.addSavingsGoalContribution.mutateAsync(input);
              }}
              onDeleteContribution={(id) =>
                mutations.deleteSavingsGoalContribution.mutateAsync(id)
              }
              onCreateTransfer={async (input) => {
                await mutations.createWalletTransfer.mutateAsync(input);
              }}
              onDeleteTransfer={(id) => mutations.deleteWalletTransfer.mutateAsync(id)}
            />
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
              onReorderCategories={(type, orderedIds) =>
                mutations.reorderCategories.mutateAsync({ type, orderedIds })
              }
              onReplaceCategory={(sourceId, targetId, deleteSource) =>
                mutations.replaceCategory.mutateAsync({ sourceId, targetId, deleteSource })
              }
              onExportBackup={() => mutations.exportBackup.mutateAsync()}
              onImportBackup={async (backup) => {
                await mutations.importBackup.mutateAsync(backup);
              }}
            />
          ) : null}
        </motion.div>
      </main>

      <BottomNavigation activeView={activeView} labels={t.nav} onChange={setActiveView} />
      <UpdateAnnouncement t={t} />
      <CookieNotice />
    </div>
  );
}
