import { beforeEach, describe, expect, it } from "vitest";
import { financeDb, resetDatabaseForTests, seedLocalData } from "../db/database";
import { backupRepository } from "./backupRepository";
import { budgetRepository } from "./budgetRepository";
import { categoryRepository } from "./categoryRepository";
import { recurringTransactionRepository } from "./recurringTransactionRepository";
import { savingsGoalRepository } from "./savingsGoalRepository";
import { settingsRepository } from "./settingsRepository";
import { transactionRepository } from "./transactionRepository";
import { walletRepository } from "./walletRepository";
import { walletTransferRepository } from "./walletTransferRepository";

describe("finance repositories", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it("seeds local settings, wallets, and categories", async () => {
    await seedLocalData();

    expect(await settingsRepository.getSettings()).toMatchObject({
      id: "default",
      locale: "ru-RU",
      activeWalletId: "all",
      colorTheme: "sage",
      onboardingCompleted: false
    });
    expect(await walletRepository.listWallets()).toHaveLength(1);
    expect(await categoryRepository.listCategories("expense")).not.toHaveLength(0);
    expect(await categoryRepository.listCategories("income")).not.toHaveLength(0);
  });

  it("creates, updates, and archives wallets", async () => {
    await seedLocalData();

    const wallet = await walletRepository.createWallet({
      name: "Savings",
      currency: "eur",
      initialBalanceMinor: 12500,
      color: "#7b61ff",
      icon: "piggy-bank"
    });
    const updated = await walletRepository.updateWallet(wallet.id, { name: "Reserve" });

    expect(updated).toMatchObject({
      name: "Reserve",
      currency: "EUR",
      initialBalanceMinor: 12500,
      color: "#7b61ff",
      icon: "piggy-bank"
    });
    expect(await walletRepository.listWallets()).toHaveLength(2);

    await walletRepository.archiveWallet(wallet.id);

    expect(await walletRepository.listWallets()).toHaveLength(1);
    expect(await walletRepository.listWallets({ includeArchived: true })).toHaveLength(2);

    await walletRepository.restoreWallet(wallet.id);

    expect(await walletRepository.listWallets()).toHaveLength(2);
    expect(
      (await walletRepository.listWallets()).find((item) => item.id === wallet.id)
    ).toMatchObject({ archivedAt: null, color: "#7b61ff", icon: "piggy-bank" });
  });

  it("does not archive the last active wallet", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();

    await expect(walletRepository.archiveWallet(wallet.id)).rejects.toThrow(
      "last active wallet"
    );
    expect(await walletRepository.listWallets()).toHaveLength(1);
  });

  it("updates settings without clearing existing currency", async () => {
    await seedLocalData();
    const before = await settingsRepository.getSettings();

    const after = await settingsRepository.updateSettings({ activeWalletId: "all" });

    expect(after.currency).toBe(before.currency);
  });

  it("can complete onboarding through settings", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();

    const updatedWallet = await walletRepository.updateWallet(wallet.id, { name: "Main", currency: "eur" });
    const settings = await settingsRepository.updateSettings({
      locale: "ru-RU",
      currency: "usd",
      theme: "dark",
      colorTheme: "rose",
      activeWalletId: updatedWallet.id,
      onboardingCompleted: true
    });

    expect(updatedWallet).toMatchObject({ name: "Main", currency: "EUR" });
    expect(settings).toMatchObject({
      locale: "ru-RU",
      currency: "USD",
      theme: "dark",
      colorTheme: "rose",
      activeWalletId: updatedWallet.id,
      onboardingCompleted: true
    });
  });

  it("keeps wallet currency independent from the global settings currency", async () => {
    await seedLocalData();
    const wallet = await walletRepository.createWallet({ name: "Euro wallet", currency: "eur" });
    const [category] = await categoryRepository.listCategories("expense");
    const transaction = await transactionRepository.addTransaction({
      walletId: wallet.id,
      categoryId: category.id,
      type: "expense",
      amountMinor: 1200,
      currency: "usd",
      transactionDate: new Date("2026-05-31T00:00:00.000Z").toISOString()
    });

    await settingsRepository.updateSettings({ currency: "gbp" });

    expect(transaction.currency).toBe("EUR");
    expect((await settingsRepository.getSettings()).currency).toBe("GBP");
    expect((await walletRepository.listWallets({ includeArchived: true })).find((item) => item.id === wallet.id)?.currency).toBe("EUR");
    expect((await transactionRepository.listTransactions({ includeDeleted: true })).find((item) => item.id === transaction.id)?.currency).toBe("EUR");

    await walletRepository.updateWallet(wallet.id, { currency: "pln" });

    expect((await walletRepository.listWallets({ includeArchived: true })).find((item) => item.id === wallet.id)?.currency).toBe("PLN");
    expect((await transactionRepository.listTransactions({ includeDeleted: true })).find((item) => item.id === transaction.id)?.currency).toBe("PLN");
  });

  it("repairs old local rows that are missing currency", async () => {
    await seedLocalData();
    const settings = await settingsRepository.getSettings();
    const [wallet] = await walletRepository.listWallets();
    const [category] = await categoryRepository.listCategories("expense");
    const transaction = await transactionRepository.addTransaction({
      walletId: wallet.id,
      categoryId: category.id,
      type: "expense",
      amountMinor: 1200,
      currency: wallet.currency,
      transactionDate: new Date("2026-05-31T00:00:00.000Z").toISOString()
    });

    await financeDb.settings.put({ ...settings, currency: undefined, colorTheme: undefined } as never);
    await financeDb.wallets.put({
      ...wallet,
      currency: undefined,
      color: undefined,
      icon: undefined
    } as never);
    await financeDb.transactions.put({ ...transaction, currency: undefined, tags: undefined } as never);

    await seedLocalData();

    expect((await settingsRepository.getSettings()).currency).toBeTruthy();
    expect((await settingsRepository.getSettings()).colorTheme).toBe("sage");
    expect((await walletRepository.listWallets())[0].currency).toBeTruthy();
    expect((await walletRepository.listWallets())[0].initialBalanceMinor).toBe(0);
    expect((await walletRepository.listWallets())[0]).toMatchObject({
      color: "#207a6f",
      icon: "wallet-cards"
    });
    expect((await transactionRepository.listTransactions({ includeDeleted: true }))[0].currency).toBeTruthy();
    expect((await transactionRepository.listTransactions({ includeDeleted: true }))[0].tags).toEqual([]);
  });

  it("adds, lists, updates, and soft deletes transactions", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();
    const [category] = await categoryRepository.listCategories("expense");

    const transaction = await transactionRepository.addTransaction({
      walletId: wallet.id,
      categoryId: category.id,
      type: "expense",
      amountMinor: 2500,
      currency: wallet.currency,
      transactionDate: new Date("2026-05-31T00:00:00.000Z").toISOString(),
      note: "Lunch",
      tags: [" Coffee ", "#Work", "coffee"]
    });

    expect(await transactionRepository.listTransactions({ walletId: wallet.id })).toHaveLength(1);
    expect(transaction.tags).toEqual(["Coffee", "Work"]);

    const updated = await transactionRepository.updateTransaction(transaction.id, {
      amountMinor: 3000,
      tags: ["team", "Team", "#Q2"]
    });
    expect(updated.amountMinor).toBe(3000);
    expect(updated.tags).toEqual(["team", "Q2"]);

    await transactionRepository.deleteTransaction(transaction.id);

    expect(await transactionRepository.listTransactions({ walletId: wallet.id })).toHaveLength(0);
    expect(await transactionRepository.listTransactions({ walletId: wallet.id, includeDeleted: true })).toHaveLength(1);
  });

  it("moves money between wallets without creating income or expense transactions", async () => {
    await seedLocalData();
    const [source] = await walletRepository.listWallets();
    const destination = await walletRepository.createWallet({
      name: "Travel",
      currency: "eur",
      initialBalanceMinor: 2000
    });

    const transfer = await walletTransferRepository.createTransfer({
      fromWalletId: source.id,
      toWalletId: destination.id,
      fromAmountMinor: 11000,
      toAmountMinor: 10000,
      transferDate: "2026-07-26T12:00:00.000Z",
      note: "Trip fund"
    });

    expect(transfer).toMatchObject({
      fromCurrency: source.currency,
      toCurrency: "EUR",
      fromAmountMinor: 11000,
      toAmountMinor: 10000
    });
    expect(await transactionRepository.listTransactions()).toHaveLength(0);
    expect(await walletTransferRepository.listTransfers()).toHaveLength(1);

    await walletTransferRepository.deleteTransfer(transfer.id);

    expect(await walletTransferRepository.listTransfers()).toHaveLength(0);
    expect(await walletTransferRepository.listTransfers({ includeDeleted: true })).toHaveLength(1);
  });

  it("rejects transfers that use the same wallet twice", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();

    await expect(
      walletTransferRepository.createTransfer({
        fromWalletId: wallet.id,
        toWalletId: wallet.id,
        fromAmountMinor: 1000,
        toAmountMinor: 1000,
        transferDate: "2026-07-26T12:00:00.000Z"
      })
    ).rejects.toThrow();
  });

  it("materializes due recurring transactions once and advances the schedule", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();
    const [category] = await categoryRepository.listCategories("expense");
    const schedule = await recurringTransactionRepository.createRecurringTransaction({
      walletId: wallet.id,
      categoryId: category.id,
      type: "expense",
      amountMinor: 1299,
      currency: wallet.currency,
      frequency: "daily",
      startDate: "2026-07-24",
      note: "Subscription",
      tags: ["Auto"]
    });

    expect(await recurringTransactionRepository.materializeDueTransactions("2026-07-26")).toBe(3);
    expect(await recurringTransactionRepository.materializeDueTransactions("2026-07-26")).toBe(0);

    const transactions = await transactionRepository.listTransactions({ walletId: wallet.id });
    expect(transactions.map((transaction) => transaction.recurrenceDate).sort()).toEqual([
      "2026-07-24",
      "2026-07-25",
      "2026-07-26"
    ]);
    expect(new Set(transactions.map((transaction) => transaction.recurringTransactionId))).toEqual(
      new Set([schedule.id])
    );
    expect((await recurringTransactionRepository.listRecurringTransactions())[0].nextRunDate).toBe("2026-07-27");

    const updated = await recurringTransactionRepository.updateRecurringTransaction(schedule.id, {
      note: undefined
    });
    expect(updated.note).toBeUndefined();
    expect(updated.nextRunDate).toBe("2026-07-27");
  });

  it("does not materialize paused recurring transactions", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();
    const [category] = await categoryRepository.listCategories("income");
    const schedule = await recurringTransactionRepository.createRecurringTransaction({
      walletId: wallet.id,
      categoryId: category.id,
      type: "income",
      amountMinor: 100000,
      currency: wallet.currency,
      frequency: "monthly",
      startDate: "2026-07-01"
    });
    await recurringTransactionRepository.setRecurringTransactionPaused(schedule.id, true);

    expect(await recurringTransactionRepository.materializeDueTransactions("2026-07-26")).toBe(0);
    expect(await transactionRepository.listTransactions()).toHaveLength(0);
  });

  it("tracks savings goal contributions and removes them with the goal", async () => {
    await seedLocalData();
    const [wallet] = await walletRepository.listWallets();
    const goal = await savingsGoalRepository.createGoal({
      walletId: wallet.id,
      name: "Emergency fund",
      targetAmountMinor: 100000,
      currency: wallet.currency,
      targetDate: "2026-12-31",
      color: "#207a6f"
    });
    const first = await savingsGoalRepository.addContribution({
      goalId: goal.id,
      amountMinor: 15000,
      contributionDate: "2026-07-25T12:00:00.000Z",
      note: "First step"
    });
    await savingsGoalRepository.addContribution({
      goalId: goal.id,
      amountMinor: 5000,
      contributionDate: "2026-07-26T12:00:00.000Z"
    });
    expect(await savingsGoalRepository.listGoals()).toMatchObject([
      { id: goal.id, name: "Emergency fund", targetAmountMinor: 100000 }
    ]);
    expect(await savingsGoalRepository.listContributions()).toHaveLength(2);

    await savingsGoalRepository.deleteContribution(first.id);
    expect(await savingsGoalRepository.listContributions()).toHaveLength(1);

    await savingsGoalRepository.deleteGoal(goal.id);
    expect(await savingsGoalRepository.listGoals()).toHaveLength(0);
    expect(await savingsGoalRepository.listContributions()).toHaveLength(0);
  });

  it("creates, updates, and clears monthly category budgets", async () => {
    await seedLocalData();
    const [category] = await categoryRepository.listCategories("expense");

    await budgetRepository.setBudget({
      categoryId: category.id,
      month: "2026-07",
      amountMinor: 50000,
      currency: "usd"
    });
    expect(await budgetRepository.listBudgets("2026-07")).toMatchObject([
      { categoryId: category.id, amountMinor: 50000, currency: "USD" }
    ]);

    await budgetRepository.setBudget({
      categoryId: category.id,
      month: "2026-07",
      amountMinor: 65000,
      currency: "USD"
    });
    expect((await budgetRepository.listBudgets("2026-07"))[0].amountMinor).toBe(65000);

    await budgetRepository.setBudget({
      categoryId: category.id,
      month: "2026-07",
      amountMinor: 0,
      currency: "USD"
    });
    expect(await budgetRepository.listBudgets("2026-07")).toHaveLength(0);
  });

  it("exports and restores a JSON backup", async () => {
    await seedLocalData();
    const [category] = await categoryRepository.listCategories("expense");
    await budgetRepository.setBudget({
      categoryId: category.id,
      month: "2026-07",
      amountMinor: 42000,
      currency: "USD"
    });
    const [wallet] = await walletRepository.listWallets();
    await recurringTransactionRepository.createRecurringTransaction({
      walletId: wallet.id,
      categoryId: category.id,
      type: "expense",
      amountMinor: 1599,
      currency: wallet.currency,
      frequency: "monthly",
      startDate: "2026-08-01"
    });
    const goal = await savingsGoalRepository.createGoal({
      walletId: wallet.id,
      name: "New laptop",
      targetAmountMinor: 250000,
      currency: wallet.currency,
      color: "#3f73c9"
    });
    await savingsGoalRepository.addContribution({
      goalId: goal.id,
      amountMinor: 25000,
      contributionDate: "2026-07-26T12:00:00.000Z"
    });
    const secondWallet = await walletRepository.createWallet({
      name: "Reserve",
      currency: wallet.currency
    });
    await walletTransferRepository.createTransfer({
      fromWalletId: wallet.id,
      toWalletId: secondWallet.id,
      fromAmountMinor: 5000,
      toAmountMinor: 5000,
      transferDate: "2026-07-26T12:00:00.000Z"
    });
    const backup = await backupRepository.exportBackup();

    await resetDatabaseForTests();
    await backupRepository.importBackup(backup);

    const restored = await backupRepository.exportBackup();
    expect(restored.wallets).toHaveLength(backup.wallets.length);
    expect(restored.categories).toHaveLength(backup.categories.length);
    expect(restored.budgets).toHaveLength(backup.budgets.length);
    expect(restored.budgets).toHaveLength(1);
    expect(restored.recurringTransactions).toHaveLength(1);
    expect(restored.savingsGoals).toHaveLength(1);
    expect(restored.savingsGoalContributions).toHaveLength(1);
    expect(restored.walletTransfers).toHaveLength(1);
    expect(restored.settings).toMatchObject({ id: "default" });
  });

  it("restores legacy version 4 backups without wallet transfers", async () => {
    await seedLocalData();
    const backup = await backupRepository.exportBackup();
    const { walletTransfers: _walletTransfers, ...legacyBackup } = backup;

    await resetDatabaseForTests();
    await backupRepository.importBackup({ ...legacyBackup, version: 4 });

    expect(await walletTransferRepository.listTransfers()).toHaveLength(0);
    expect((await walletRepository.listWallets())[0].initialBalanceMinor).toBe(0);
  });

  it("restores legacy version 3 backups without savings goals", async () => {
    await seedLocalData();
    const backup = await backupRepository.exportBackup();
    const {
      savingsGoals: _savingsGoals,
      savingsGoalContributions: _savingsGoalContributions,
      ...legacyBackup
    } = backup;

    await resetDatabaseForTests();
    await backupRepository.importBackup({ ...legacyBackup, version: 3 });

    expect(await savingsGoalRepository.listGoals()).toHaveLength(0);
    expect(await savingsGoalRepository.listContributions()).toHaveLength(0);
  });

  it("restores legacy version 2 backups without recurring transactions", async () => {
    await seedLocalData();
    const backup = await backupRepository.exportBackup();
    const { recurringTransactions: _recurringTransactions, ...legacyBackup } = backup;

    await resetDatabaseForTests();
    await backupRepository.importBackup({ ...legacyBackup, version: 2 });

    expect(await recurringTransactionRepository.listRecurringTransactions()).toHaveLength(0);
    expect((await backupRepository.exportBackup()).wallets).toHaveLength(backup.wallets.length);
  });

  it("restores legacy version 1 backups without budgets", async () => {
    await seedLocalData();
    const backup = await backupRepository.exportBackup();
    const { budgets: _budgets, ...legacyBackup } = backup;

    await resetDatabaseForTests();
    await backupRepository.importBackup({ ...legacyBackup, version: 1 });

    expect(await budgetRepository.listBudgets()).toHaveLength(0);
    expect((await backupRepository.exportBackup()).wallets).toHaveLength(backup.wallets.length);
  });
});
