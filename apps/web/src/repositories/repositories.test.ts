import { beforeEach, describe, expect, it } from "vitest";
import { financeDb, resetDatabaseForTests, seedLocalData } from "../db/database";
import { backupRepository } from "./backupRepository";
import { categoryRepository } from "./categoryRepository";
import { settingsRepository } from "./settingsRepository";
import { transactionRepository } from "./transactionRepository";
import { walletRepository } from "./walletRepository";

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

    const wallet = await walletRepository.createWallet({ name: "Savings", currency: "eur" });
    const updated = await walletRepository.updateWallet(wallet.id, { name: "Reserve" });

    expect(updated).toMatchObject({ name: "Reserve", currency: "EUR" });
    expect(await walletRepository.listWallets()).toHaveLength(2);

    await walletRepository.archiveWallet(wallet.id);

    expect(await walletRepository.listWallets()).toHaveLength(1);
    expect(await walletRepository.listWallets({ includeArchived: true })).toHaveLength(2);
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
    await financeDb.wallets.put({ ...wallet, currency: undefined } as never);
    await financeDb.transactions.put({ ...transaction, currency: undefined } as never);

    await seedLocalData();

    expect((await settingsRepository.getSettings()).currency).toBeTruthy();
    expect((await settingsRepository.getSettings()).colorTheme).toBe("sage");
    expect((await walletRepository.listWallets())[0].currency).toBeTruthy();
    expect((await transactionRepository.listTransactions({ includeDeleted: true }))[0].currency).toBeTruthy();
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
      note: "Lunch"
    });

    expect(await transactionRepository.listTransactions({ walletId: wallet.id })).toHaveLength(1);

    const updated = await transactionRepository.updateTransaction(transaction.id, { amountMinor: 3000 });
    expect(updated.amountMinor).toBe(3000);

    await transactionRepository.deleteTransaction(transaction.id);

    expect(await transactionRepository.listTransactions({ walletId: wallet.id })).toHaveLength(0);
    expect(await transactionRepository.listTransactions({ walletId: wallet.id, includeDeleted: true })).toHaveLength(1);
  });

  it("exports and restores a JSON backup", async () => {
    await seedLocalData();
    const backup = await backupRepository.exportBackup();

    await resetDatabaseForTests();
    await backupRepository.importBackup(backup);

    const restored = await backupRepository.exportBackup();
    expect(restored.wallets).toHaveLength(backup.wallets.length);
    expect(restored.categories).toHaveLength(backup.categories.length);
    expect(restored.settings).toMatchObject({ id: "default" });
  });
});
