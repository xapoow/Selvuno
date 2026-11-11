import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import type { WalletView } from "@selvuno/types";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { calculateWalletAdjustmentTotal } from "@selvuno/utils";
import { BottomNavigation } from "./components/BottomNavigation";
import { CookieNotice } from "./components/CookieNotice";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { MobileWalletDashboardPager } from "./components/MobileWalletDashboardPager";
import { NotificationCenter } from "./components/NotificationCenter";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { LockScreen } from "./components/LockScreen";
import { UpdateAnnouncement } from "./components/UpdateAnnouncement";
import { TransactionUndoNotice } from "./components/TransactionUndoNotice";
import { TransactionTrash } from "./components/TransactionTrash";
import { WalletSwitcher } from "./components/WalletSwitcher";
import { MonobankWalletCarousel } from "./components/MonobankWalletCarousel";
import { ErrorScreen } from "./components/ErrorScreen";
import { getDictionary } from "./i18n";
import { applyRootVisualTheme } from "./lib/colorThemes";
import { useExchangeRates } from "./lib/exchangeRates";
import { buildAppNotifications } from "./lib/notifications";
import { haptics } from "./lib/haptics";
import { historyPath, settingsPath, walletPath, viewPaths, type DashboardPage, type HistoryMode, type RoutableSettingsTab } from "./lib/routes";
import { useAppStore, type AppView } from "./state/appStore";
import { useFinanceData, useFinanceMutations } from "./state/useFinanceQueries";
import { usePrivacyLock } from "./state/usePrivacyLock";
import { useTransactionDeletion } from "./state/useTransactionDeletion";
import { getIncludedWalletIds, shouldHideWalletAmounts } from "./lib/walletFeatures";
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
  const activeView = useAppStore((state) => state.activeView);
  const route = useAppStore((state) => state.route);
  const navigateRoute = useAppStore((state) => state.navigate);
  const setRouteWallet = useAppStore((state) => state.setRouteWallet);
  const backTo = useAppStore((state) => state.backTo);
  const dashboardPage: DashboardPage = route.path === "/analytics" ? "analytics" : route.path === "/budget" ? "budget" : "overview";
  const historyMode: HistoryMode = route.path === "/history/table" ? "table" : route.path === "/history/calendar" ? "calendar" : "list";
  const setDashboardPage = (page: DashboardPage) => navigateRoute(page === "overview" ? "/" : page === "budget" ? "/budget" : "/analytics");
  const setActiveView = useAppStore((state) => state.setActiveView);
  const prevViewRef = useRef<AppView>(activeView);
  const viewTransitionDirection = (viewOrder[activeView] ?? 0) >= (viewOrder[prevViewRef.current] ?? 0) ? 1 : -1;

  useEffect(() => {
    prevViewRef.current = activeView;
  }, [activeView]);
  const [walletTransitionDirection, setWalletTransitionDirection] = useState(1);
  const privacy = usePrivacyLock();
  const data = useFinanceData();
  const mutations = useFinanceMutations();
  const [trashOpen, setTrashOpen] = useState(false);
  const openGoals = () => navigateRoute("/wallets/goals");
  const navigate = (view: AppView) => navigateRoute(viewPaths[view], { walletId: activeWalletId });
  const deletion = useTransactionDeletion({
    deleteTransactions: (ids) => mutations.deleteTransactions.mutateAsync(ids),
    restoreTransactions: (deleted) => mutations.restoreTransactions.mutateAsync(deleted)
  });

  const settings = data.settings.data;
  useEffect(() => { if (!settings?.hapticsEnabled) haptics.cancel(); }, [settings?.hapticsEnabled]);
  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState !== "visible") haptics.cancel(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => { document.removeEventListener("visibilitychange", onVisibilityChange); haptics.cancel(); };
  }, []);
  const wallets = data.wallets.data ?? [];
  const archivedWallets = data.archivedWallets.data ?? [];
  const categories = data.categories.data ?? [];
  const transactions = data.transactions.data ?? [];
  const transactionTemplates = data.transactionTemplates.data ?? [];
  const budgets = data.budgets.data ?? [];
  const recurringTransactions = data.recurringTransactions.data ?? [];
  const savingsGoals = data.savingsGoals.data ?? [];
  const savingsGoalContributions = data.savingsGoalContributions.data ?? [];
  const walletTransfers = data.walletTransfers.data ?? [];
  const backupSnapshots = data.backupSnapshots.data ?? [];
  const isLoading =
    data.bootstrap.isLoading ||
    data.settings.isLoading ||
    data.wallets.isLoading ||
    data.archivedWallets.isLoading ||
    data.categories.isLoading ||
    data.transactions.isLoading ||
    data.transactionTemplates.isLoading ||
    data.budgets.isLoading ||
    data.recurringTransactions.isLoading ||
    data.savingsGoals.isLoading ||
    data.savingsGoalContributions.isLoading ||
    data.walletTransfers.isLoading ||
    data.backupSnapshots.isLoading;
  const isError =
    data.bootstrap.isError ||
    data.settings.isError ||
    data.wallets.isError ||
    data.archivedWallets.isError ||
    data.categories.isError ||
    data.transactions.isError ||
    data.transactionTemplates.isError ||
    data.budgets.isError ||
    data.recurringTransactions.isError ||
    data.savingsGoals.isError ||
    data.savingsGoalContributions.isError ||
    data.walletTransfers.isError ||
    data.backupSnapshots.isError;
  const fallbackT = getDictionary(settings?.locale ?? (typeof navigator === "undefined" ? "en-US" : navigator.language));
  const lastBackupRevision = useRef("");
  const backupRevision = [
    wallets,
    archivedWallets,
    categories,
    transactions,
    transactionTemplates,
    budgets,
    recurringTransactions,
    savingsGoals,
    savingsGoalContributions,
    walletTransfers
  ]
    .flatMap((items) => items.map((item) => `${item.id}:${item.updatedAt}`))
    .sort()
    .join("|");

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
    if (
      isLoading ||
      !settings?.onboardingCompleted ||
      !backupRevision ||
      lastBackupRevision.current === backupRevision
    ) {
      return;
    }
    lastBackupRevision.current = backupRevision;
    const timer = window.setTimeout(() => {
      void mutations.createBackupSnapshot.mutateAsync().catch(() => {
        lastBackupRevision.current = "";
      });
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [backupRevision, isLoading, settings?.onboardingCompleted]);

  const selectedWalletId = route.walletId;

  const activeWalletId: WalletView =
    selectedWalletId !== null
      ? selectedWalletId === "all" || wallets.some((wallet) => wallet.id === selectedWalletId) ? selectedWalletId : "all"
      : settings && (settings.activeWalletId === "all" || wallets.some((wallet) => wallet.id === settings.activeWalletId))
        ? settings.activeWalletId
        : "all";
  useEffect(() => {
    if (!isLoading && !isError && route.walletId && route.walletId !== "all" && !wallets.some((wallet) => wallet.id === route.walletId)) {
      setRouteWallet("all");
    }
  }, [isLoading, isError, route.walletId, wallets, setRouteWallet]);
  const activeWallet = activeWalletId === "all" ? undefined : wallets.find((wallet) => wallet.id === activeWalletId);
  const displayCurrency = settings ? activeWallet?.currency ?? settings.currency : "USD";
  const includedWalletIds = getIncludedWalletIds(
    wallets,
    settings?.advancedWalletsEnabled ?? false
  );
  const walletIsInCurrentStatistics = (walletId: string) =>
    activeWalletId === "all" ? includedWalletIds.has(walletId) : walletId === activeWalletId;
  const conversionNeeded = Boolean(
    settings &&
      (transactions.some(
        (transaction) =>
          !transaction.deletedAt &&
          walletIsInCurrentStatistics(transaction.walletId) &&
          transaction.currency.toUpperCase() !== displayCurrency
      ) ||
        wallets.some(
          (wallet) =>
            !wallet.deletedAt &&
            walletIsInCurrentStatistics(wallet.id) &&
            wallet.currency.toUpperCase() !== displayCurrency &&
            (wallet.initialBalanceMinor + calculateWalletAdjustmentTotal(wallet)) !== 0
        ) ||
        walletTransfers.some(
          (transfer) =>
            !transfer.deletedAt &&
            ((walletIsInCurrentStatistics(transfer.fromWalletId) &&
              transfer.fromCurrency.toUpperCase() !== displayCurrency) ||
              (walletIsInCurrentStatistics(transfer.toWalletId) &&
                transfer.toCurrency.toUpperCase() !== displayCurrency))
        ))
  );
  const exchangeRates = useExchangeRates(displayCurrency, conversionNeeded);
  const handleWalletChange = (nextWalletId: WalletView, direction = 1) => {
    setRouteWallet(nextWalletId);
    setWalletTransitionDirection(direction);
    void mutations.updateSettings.mutateAsync({ activeWalletId: nextWalletId }).catch(() => undefined);
  };
  const addWalletId: WalletView = activeWalletId === "all" ? wallets[0]?.id ?? "all" : activeWalletId;
  const addWallet = wallets.find((wallet) => wallet.id === addWalletId);
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
          data.transactionTemplates.error instanceof Error
            ? data.transactionTemplates.error.message
            : null,
          data.budgets.error instanceof Error ? data.budgets.error.message : null,
          data.recurringTransactions.error instanceof Error ? data.recurringTransactions.error.message : null,
          data.savingsGoals.error instanceof Error ? data.savingsGoals.error.message : null,
          data.savingsGoalContributions.error instanceof Error
            ? data.savingsGoalContributions.error.message
            : null,
          data.walletTransfers.error instanceof Error ? data.walletTransfers.error.message : null,
          data.backupSnapshots.error instanceof Error ? data.backupSnapshots.error.message : null
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

  if (privacy.locked) {
    return <LockScreen t={t} onUnlock={privacy.unlock} hapticsEnabled={settings.hapticsEnabled} />;
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
          onUpdateSettings={async (input) => mutations.updateSettings.mutateAsync(input)}
          onCreateWallet={(input) => mutations.createWallet.mutateAsync(input)}
          onUpdateWallet={(id, input) => mutations.updateWallet.mutateAsync({ id, input })}
        />
        <CookieNotice />
        <OfflineIndicator t={fallbackT} />
      </>
    );
  }

  return (
    <div className="app-page-bg min-h-dvh text-foreground md:pl-[236px]">
      <aside className="app-chrome fixed inset-y-0 left-0 z-40 hidden h-dvh w-[236px] overflow-y-auto overscroll-contain p-4 shadow-[1px_0_0_0_rgb(var(--color-foreground)/0.04)] md:flex md:flex-col">
        <div className="mb-7 px-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t.brand}</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{t.appName}</h1>
        </div>
        <HeaderNavigation activeView={activeView} labels={t.nav} onChange={navigate} walletId={activeWalletId} />
        <div className="mt-auto grid gap-2">
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

      <main className="mx-auto w-full min-w-0 max-w-[1180px] overflow-x-clip px-4 pb-28 pt-[calc(env(safe-area-inset-top)+16px)] md:px-8 md:pb-10 md:pt-7 lg:px-10">
        <div className="mb-3 flex justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              void mutations.updateSettings.mutateAsync({ hideAmounts: !settings.hideAmounts })
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
          <NotificationCenter notifications={notifications} t={t} locale={settings.locale} />
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
                  page={dashboardPage}
                  onPageChange={setDashboardPage}
                  onBack={() => backTo("/")}
                  wallets={wallets}
                  categories={categories}
                  transactions={transactions}
                  transfers={walletTransfers}
                  budgets={budgets}
                  goals={savingsGoals}
                  contributions={savingsGoalContributions}
                  onOpenGoals={openGoals}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  allLabel={t.wallets.allWallets}
                  t={t}
                  onChange={handleWalletChange}
                  onAdd={() => setActiveView("add")}
                  onSetBudget={(input) => mutations.setBudget.mutateAsync(input)}
                  onUpdateTransaction={async (id, submission) => { await mutations.updateTransactionWithAttachments.mutateAsync({ id, submission }); }}
                  onDeleteTransaction={deletion.deleteOne}
                />
              </div>
              <div className="hidden min-w-0 md:block">
                <motion.div
                  key={activeWalletId}
                  initial={{ opacity: 0, x: walletTransitionDirection * 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DashboardView
                    page={dashboardPage}
                    onPageChange={setDashboardPage}
                    onBack={() => backTo("/")}
                    wallets={wallets}
                    categories={categories}
                    transactions={transactions}
                    transfers={walletTransfers}
                    budgets={budgets}
                    goals={savingsGoals}
                    contributions={savingsGoalContributions}
                    onOpenGoals={openGoals}
                    settings={settings}
                    activeWalletId={activeWalletId}
                    displayCurrency={displayCurrency}
                    exchangeRates={exchangeRates.data}
                    isUpdatingExchangeRates={exchangeRates.isFetching && conversionNeeded}
                    hasExchangeRateError={exchangeRates.isError && conversionNeeded}
                    direction={walletTransitionDirection}
                    t={t}
                    onAdd={() => setActiveView("add")}
                    onSetBudget={(input) => mutations.setBudget.mutateAsync(input)}
                    onUpdateTransaction={async (id, submission) => { await mutations.updateTransactionWithAttachments.mutateAsync({ id, submission }); }}
                    onDeleteTransaction={deletion.deleteOne}
                  />
                </motion.div>
              </div>
            </>
          ) : null}
          {activeView === "add" ? (
            <AddTransactionView
              mode={route.path === "/add/recurring" ? "recurring" : "single"}
              onModeChange={(mode) => navigateRoute(mode === "single" ? "/add" : "/add/recurring")}
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
                await mutations.addTransactionWithAttachments.mutateAsync(submission);
              }}
              onCreateTemplate={async (input) => {
                await mutations.createTransactionTemplate.mutateAsync(input);
              }}
              onDeleteTemplate={async (id) => {
                await mutations.deleteTransactionTemplate.mutateAsync(id);
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
            <div className="min-w-0">
              <motion.div
                key={activeWalletId}
                initial={{ opacity: 0, x: walletTransitionDirection * 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <HistoryView
                  mode={historyMode}
                  onModeChange={(mode) => navigateRoute(historyPath(mode))}
                  wallets={wallets}
                  categories={categories}
                  transactions={transactions}
                  settings={settings}
                  activeWalletId={activeWalletId}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates.data}
                  t={t}
                  desktopTools
                  onOpenTrash={() => { deletion.dismiss(); setTrashOpen(true); }}
                  deletedCount={data.deletedTransactions.data?.length ?? 0}
                  onDeleteMany={deletion.deleteMany}
                  onUpdate={async (id, input) => {
                    await mutations.updateTransaction.mutateAsync({ id, input });
                  }}
                  onUpdateWithAttachments={async (id, submission) => {
                    await mutations.updateTransactionWithAttachments.mutateAsync({ id, submission });
                  }}
                  onDelete={deletion.deleteOne}
                />
              </motion.div>
            </div>
          ) : null}
          {activeView === "wallets" ? (
            <WalletsHubView
              mode={route.path === "/wallets/goals" ? "goals" : route.path === "/wallets/transfers" ? "transfers" : "wallets"}
              onModeChange={(mode) => navigateRoute(walletPath(mode))}
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
              onReorderWallet={async (orderedIds) => {
                await mutations.reorderWallets.mutateAsync(orderedIds);
              }}
              onReconcileWallet={async (input) => { await mutations.reconcileWallet.mutateAsync(input); }}
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
              activeTab={(route.path === "/settings" ? "general" : route.path?.slice("/settings/".length)) as RoutableSettingsTab}
              onTabChange={(tab) => {
                // An exiting settings sheet must not override a newer Back/Forward navigation.
                if (tab !== "debug" && useAppStore.getState().route.path === route.path) navigateRoute(settingsPath(tab));
              }}
              settings={settings}
              categories={categories}
              backupSnapshots={backupSnapshots}
              privacy={privacy}
              t={t}
              onUpdateSettings={async (input) => {
                await mutations.updateSettings.mutateAsync(input);
              }}
              onOpenTrash={() => { deletion.dismiss(); setTrashOpen(true); }}
              deletedCount={data.deletedTransactions.data?.length ?? 0}
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
              onRestoreBackupSnapshot={async (id) => {
                await mutations.restoreBackupSnapshot.mutateAsync(id);
              }}
              onDeleteBackupSnapshot={(id) =>
                mutations.deleteBackupSnapshot.mutateAsync(id)
              }
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
      </main>

      <BottomNavigation activeView={activeView} labels={t.nav} onChange={navigate} walletId={activeWalletId} />
      <TransactionUndoNotice deletion={deletion} t={t} onOpenTrash={() => setTrashOpen(true)} />
      <TransactionTrash
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        transactions={data.deletedTransactions.data ?? []}
        wallets={[...wallets, ...archivedWallets]}
        categories={categories}
        settings={settings}
        t={t}
        loading={data.deletedTransactions.isLoading}
        loadError={data.deletedTransactions.isError}
        onRestore={(deleted) => mutations.restoreTransactions.mutateAsync(deleted)}
        onRetry={() => { void data.deletedTransactions.refetch(); }}
      />
      <UpdateAnnouncement t={t} locale={settings.locale} />
      <CookieNotice />
      <OfflineIndicator t={t} />
    </div>
  );
}
