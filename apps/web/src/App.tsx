import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { WalletView } from "@myfinances/types";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { BottomNavigation } from "./components/BottomNavigation";
import { CookieNotice } from "./components/CookieNotice";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { MobileWalletDashboardPager } from "./components/MobileWalletDashboardPager";
import { NotificationCenter } from "./components/NotificationCenter";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { LockScreen } from "./components/LockScreen";
import { UpdateAnnouncement } from "./components/UpdateAnnouncement";
import { WalletSwitcher } from "./components/WalletSwitcher";
import { MonobankWalletCarousel } from "./components/MonobankWalletCarousel";
import { ErrorScreen } from "./components/ErrorScreen";
import { getDictionary } from "./i18n";
import { applyRootVisualTheme } from "./lib/colorThemes";
import { useExchangeRates } from "./lib/exchangeRates";
import { buildAppNotifications } from "./lib/notifications";
import type { AppView } from "./state/uiSlice";
import { uiActions } from "./state/uiSlice";
import { useAppDispatch, useAppSelector, useAppServices } from "./state/hooks";
import { selectWalletContext } from "./state/financeSelectors";
import { loadFinance } from "./state/financeActions";
import { useFinanceData, useFinanceCommands } from "./state/useFinance";
import { usePrivacyLock } from "./state/usePrivacyLock";
import { shouldHideWalletAmounts } from "./lib/walletFeatures";
import { getDesktopShortcut } from "./lib/desktopShortcuts";
import { AddTransactionView } from "./views/AddTransactionView";
import { DashboardView } from "./views/DashboardView";
import { HistoryView } from "./views/HistoryView";
import { OnboardingView } from "./views/OnboardingView";
import { SettingsView } from "./views/SettingsView";
import { WalletsHubView } from "./views/WalletsHubView";

const viewOrder: Record<AppView, number> = {
  dashboard: 0,
  history: 1,
  add: 2,
  wallets: 3,
  settings: 4
};

const pageVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 18,
    scale: 0.998
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.22, 1, 0.36, 1] as const
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: -direction * 12,
    scale: 0.998,
    transition: {
      duration: 0.12,
      ease: "easeOut"
    }
  })
};

export function App() {
  const dataMode = useAppServices().finance.mode;
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((state) => state.ui.activeView);
  const setActiveView = (view: AppView) => { dispatch(uiActions.viewChanged(view)); };
  const prevViewRef = useRef<AppView>(activeView);
  const viewTransitionDirection = (viewOrder[activeView] ?? 0) >= (viewOrder[prevViewRef.current] ?? 0) ? 1 : -1;

  useEffect(() => {
    prevViewRef.current = activeView;
  }, [activeView]);
  const [walletTransitionDirection, setWalletTransitionDirection] = useState(1);
  const historySearchRequest = useAppSelector((state) => state.ui.historySearchRequest);
  const privacy = usePrivacyLock();
  const data = useFinanceData();
  const mutations = useFinanceCommands();

  const {
    settings, wallets, archivedWallets, categories, transactions, transactionTemplates,
    budgets, recurringTransactions, savingsGoals, savingsGoalContributions,
    walletTransfers, backupSnapshots, isLoading
  } = data;
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
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeView]);

  useEffect(() => {
    if (!settings?.onboardingCompleted || privacy.locked) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = getDesktopShortcut(event);
      if (!shortcut) {
        return;
      }
      event.preventDefault();
      if (shortcut === "add-transaction") {
        setActiveView("add");
        return;
      }
      dispatch(uiActions.historySearchRequested());
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [privacy.locked, dispatch, settings?.onboardingCompleted]);

  const { activeWalletId, activeWallet, displayCurrency, conversionNeeded } = useAppSelector(selectWalletContext);
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);
  const handleWalletChange = (nextWalletId: WalletView, direction = 1) => {
    setWalletTransitionDirection(direction);
    void mutations.updateSettings({ activeWalletId: nextWalletId }).catch(() => undefined);
  };
  const addWalletId: WalletView = activeWalletId === "all" ? wallets[0]?.id ?? "all" : activeWalletId;
  const addWallet = wallets.find((wallet) => wallet.id === addWalletId);
  const showsWalletContext = activeView === "dashboard" || activeView === "history" || activeView === "add";

  if (data.error) {
    return (
      <ErrorScreen
        kind={data.error.status === 401 ? "unauthorized" : data.error.status === 403 ? "forbidden" :
          dataMode === "local" ? "storage" : data.error.code === "network_error" ? "unavailable" : "server"}
        copy={fallbackT.errors}
        details={data.error.message}
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

  if (privacy.locked) {
    return <LockScreen t={t} onUnlock={privacy.unlock} />;
  }

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
          onUpdateSettings={async (input) => mutations.updateSettings(input)}
          onCreateWallet={(input) => mutations.createWallet(input)}
          onUpdateWallet={(id, input) => mutations.updateWallet({ id, input })}
        />
        <CookieNotice />
        <OfflineIndicator t={fallbackT} mode={dataMode} />
      </>
    );
  }

  return (
    <div className="app-page-bg min-h-dvh text-foreground md:grid md:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="app-chrome sticky top-0 hidden h-dvh p-4 shadow-[1px_0_0_0_rgb(var(--color-foreground)/0.04)] md:flex md:flex-col">
        <div className="mb-7 px-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">MyFinances</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t.appName}</h1>
        </div>
        <HeaderNavigation activeView={activeView} labels={t.nav} onChange={setActiveView} />
        <div className="mt-auto grid gap-2">
          <div className="app-control rounded-app p-3 text-xs text-muted">
            <p className="mb-2 font-semibold uppercase tracking-wide">{t.shortcuts.title}</p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1.5">
              <kbd className="rounded-md bg-surface/80 px-1.5 py-0.5 font-mono text-foreground shadow-sm">
                Ctrl N
              </kbd>
              <span>{t.shortcuts.newTransaction}</span>
              <kbd className="rounded-md bg-surface/80 px-1.5 py-0.5 font-mono text-foreground shadow-sm">
                Ctrl K
              </kbd>
              <span>{t.shortcuts.search}</span>
            </div>
          </div>
          {showsWalletContext ? (
            <div className="app-surface rounded-app p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t.common.wallet}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">
                {activeWallet?.name ?? t.wallets.allWallets}
              </p>
              <p className="mt-0.5 text-xs text-muted">{displayCurrency}</p>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="mx-auto w-full min-w-0 max-w-[1180px] overflow-x-hidden px-4 pb-28 pt-[calc(env(safe-area-inset-top)+16px)] md:px-8 md:pb-10 md:pt-7 lg:px-10">
        {data.refreshError ? (
          <div role="status" className="app-surface mb-3 flex items-center justify-between gap-3 rounded-xl p-3 text-sm text-muted">
            <span>{data.refreshError.message}</span>
            <button type="button" className="app-focus shrink-0 rounded-lg px-2 py-1 font-semibold text-accent" disabled={data.isRefreshing} onClick={() => { void dispatch(loadFinance({ force: true })); }}>
              {t.common.reload}
            </button>
          </div>
        ) : null}
        <div className="mb-3 flex justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              void mutations.updateSettings({ hideAmounts: !settings.hideAmounts }).catch(() => undefined)
            }
            className="app-focus grid h-10 w-10 place-items-center rounded-app text-muted transition hover:bg-elevated/70 hover:text-foreground"
            aria-label={settings.hideAmounts ? t.settings.showAmounts : t.settings.hideAmounts}
            title={settings.hideAmounts ? t.settings.showAmounts : t.settings.hideAmounts}
          >
            {settings.hideAmounts ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          {privacy.pinEnabled ? (
            <button
              type="button"
              onClick={privacy.lockNow}
              className="app-focus grid h-10 w-10 place-items-center rounded-app text-muted transition hover:bg-elevated/70 hover:text-foreground"
              aria-label={t.settings.lockNow}
              title={t.settings.lockNow}
            >
              <LockKeyhole className="h-5 w-5" />
            </button>
          ) : null}
          <NotificationCenter notifications={notifications} t={t} />
        </div>
        {showsWalletContext ? (
          <div className={activeView === "dashboard" ? "mb-6 hidden md:block" : "mb-6"}>
            {activeView === "dashboard" ? (
              <MonobankWalletCarousel
                wallets={wallets}
                activeWalletId={activeWalletId}
                transactions={transactions}
                transfers={walletTransfers}
                settings={settings}
                t={t}
                onChange={handleWalletChange}
              />
            ) : (
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
            )}
          </div>
        ) : null}
        <AnimatePresence mode="wait" custom={viewTransitionDirection} initial={false}>
          <motion.div
            key={activeView}
            custom={viewTransitionDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="gpu-layer"
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
                  onSetBudget={(input) => mutations.setBudget(input)}
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
                    direction={walletTransitionDirection}
                    t={t}
                    onAdd={() => setActiveView("add")}
                    onSetBudget={(input) => mutations.setBudget(input)}
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
              templates={transactionTemplates}
              settings={{
                ...settings,
                activeWalletId: addWalletId,
                hideAmounts: shouldHideWalletAmounts(settings, addWallet)
              }}
              t={t}
              onSubmit={async (submission) => {
                await mutations.addTransactionWithAttachments(submission);
              }}
              onCreateTemplate={async (input) => {
                await mutations.createTransactionTemplate(input);
              }}
              onDeleteTemplate={async (id) => {
                await mutations.deleteTransactionTemplate(id);
              }}
              onCreateRecurring={async (input) => {
                await mutations.createRecurringTransaction(input);
              }}
              onUpdateRecurring={async (id, input) => {
                await mutations.updateRecurringTransaction({ id, input });
              }}
              onSetRecurringPaused={async (id, paused) => {
                await mutations.setRecurringTransactionPaused({ id, paused });
              }}
              onDeleteRecurring={async (id) => {
                await mutations.deleteRecurringTransaction(id);
              }}
            />
          ) : null}
          {activeView === "history" ? (
            <div className="overflow-hidden">
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
                  desktopTools
                  searchFocusRequest={historySearchRequest}
                  onUpdate={async (id, input) => {
                    await mutations.updateTransaction({ id, input });
                  }}
                  onUpdateWithAttachments={async (id, submission) => {
                    await mutations.updateTransactionWithAttachments({ id, submission });
                  }}
                  onDelete={(id) => mutations.deleteTransaction(id)}
                />
              </motion.div>
            </div>
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
                await mutations.createWallet(input);
              }}
              onUpdateWallet={async (id, input) => {
                await mutations.updateWallet({ id, input });
              }}
              onArchiveWallet={(id) => mutations.archiveWallet(id)}
              onRestoreWallet={async (id) => {
                await mutations.restoreWallet(id);
              }}
              onReorderWallet={async (orderedIds) => {
                await mutations.reorderWallets(orderedIds);
              }}
              onCreateGoal={async (input) => {
                await mutations.createSavingsGoal(input);
              }}
              onUpdateGoal={async (id, input) => {
                await mutations.updateSavingsGoal({ id, input });
              }}
              onDeleteGoal={(id) => mutations.deleteSavingsGoal(id)}
              onContribute={async (input) => {
                await mutations.addSavingsGoalContribution(input);
              }}
              onDeleteContribution={(id) =>
                mutations.deleteSavingsGoalContribution(id)
              }
              onCreateTransfer={async (input) => {
                await mutations.createWalletTransfer(input);
              }}
              onDeleteTransfer={(id) => mutations.deleteWalletTransfer(id)}
            />
          ) : null}
          {activeView === "settings" ? (
            <SettingsView
              settings={settings}
              categories={categories}
              backupSnapshots={backupSnapshots}
              privacy={privacy}
              t={t}
              onUpdateSettings={async (input) => {
                await mutations.updateSettings(input);
              }}
              onCreateCategory={async (input) => {
                await mutations.createCategory(input);
              }}
              onUpdateCategory={async (id, input) => {
                await mutations.updateCategory({ id, input });
              }}
              onDeleteCategory={(id) => mutations.deleteCategory(id)}
              onReorderCategories={(type, orderedIds) =>
                mutations.reorderCategories({ type, orderedIds })
              }
              onReplaceCategory={(sourceId, targetId, deleteSource) =>
                mutations.replaceCategory({ sourceId, targetId, deleteSource })
              }
              onExportBackup={() => mutations.exportBackup()}
              onImportBackup={async (backup) => {
                await mutations.importBackup(backup);
              }}
              onRestoreBackupSnapshot={async (id) => {
                await mutations.restoreBackupSnapshot(id);
              }}
              onDeleteBackupSnapshot={(id) =>
                mutations.deleteBackupSnapshot(id)
              }
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
      </main>

      <BottomNavigation activeView={activeView} labels={t.nav} onChange={setActiveView} />
      <UpdateAnnouncement t={t} />
      <CookieNotice />
      <OfflineIndicator t={t} mode={dataMode} />
    </div>
  );
}
