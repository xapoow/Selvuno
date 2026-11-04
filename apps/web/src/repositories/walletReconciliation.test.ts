import { beforeEach, describe, expect, it } from "vitest";
import { calculateWalletTotals } from "@myfinances/utils";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { WalletBalanceChangedError } from "../lib/walletReconciliation";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { backupRepository } from "./backupRepository";
import { transactionRepository } from "./transactionRepository";
import { walletRepository } from "./walletRepository";

const wallet = { ...testWallet, initialBalanceMinor: 10_000 };
const input = { walletId: wallet.id, currency: "USD", expectedBalanceMinor: 8750, actualBalanceMinor: 9000 };

beforeEach(async () => {
  await resetDatabaseForTests();
  await financeDb.settings.put(testSettings);
  await financeDb.wallets.put(wallet);
  await financeDb.categories.put(testCategory);
  await financeDb.transactions.put(testTransaction);
});

describe("wallet balance reconciliation", () => {
  it("adds a separate balance correction without changing transactions, opening balance, or income and expenses", async () => {
    const result = await walletRepository.reconcileBalance({ ...input, note: "Checked with bank" });
    expect(result.initialBalanceMinor).toBe(10_000);
    expect(result.balanceReconciliations).toEqual([expect.objectContaining({
      expectedBalanceMinor: 8750, actualBalanceMinor: 9000, adjustmentMinor: 250, currency: "USD", note: "Checked with bank"
    })]);
    expect(await transactionRepository.listTransactions()).toEqual([testTransaction]);
    expect(calculateWalletTotals(result, [testTransaction], [])).toMatchObject({ incomeMinor: 0, expenseMinor: 1250, balanceMinor: 9000 });
  });

  it("includes transfers and previous adjustments when reconciling, including a negative actual balance", async () => {
    await walletRepository.reconcileBalance(input);
    const target = { ...wallet, id: "10000000-0000-4000-8000-000000000002" };
    await financeDb.wallets.add(target);
    const transfer = {
      ...testTransaction, id: "40000000-0000-4000-8000-000000000001", fromWalletId: wallet.id, toWalletId: target.id,
      fromAmountMinor: 1000, toAmountMinor: 1000, fromCurrency: "USD", toCurrency: "USD", transferDate: testTransaction.transactionDate
    };
    await financeDb.walletTransfers.add(transfer);
    const result = await walletRepository.reconcileBalance({ ...input, expectedBalanceMinor: 8000, actualBalanceMinor: -1000 });
    expect(result.balanceReconciliations?.at(-1)?.adjustmentMinor).toBe(-9000);
    expect(calculateWalletTotals(result, [testTransaction], [transfer]).balanceMinor).toBe(-1000);
  });

  it("saves a matching check without changing balance and accepts zero", async () => {
    const first = await walletRepository.reconcileBalance({ ...input, actualBalanceMinor: 0 });
    const second = await walletRepository.reconcileBalance({ ...input, expectedBalanceMinor: 0, actualBalanceMinor: 0 });
    expect(first.balanceReconciliations?.[0].adjustmentMinor).toBe(-8750);
    expect(second.balanceReconciliations).toHaveLength(2);
    expect(second.balanceReconciliations?.at(-1)?.adjustmentMinor).toBe(0);
    expect(calculateWalletTotals(second, [testTransaction], []).balanceMinor).toBe(0);
  });

  it("rejects an outdated preview and serializes concurrent corrections", async () => {
    const results = await Promise.allSettled([
      walletRepository.reconcileBalance(input),
      walletRepository.reconcileBalance({ ...input, actualBalanceMinor: 8000 })
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(WalletBalanceChangedError);
    expect((await financeDb.wallets.get(wallet.id))?.balanceReconciliations).toHaveLength(1);
    await expect(walletRepository.reconcileBalance({ ...input, currency: "EUR" })).rejects.toBeInstanceOf(WalletBalanceChangedError);
  });

  it("rejects a preview made before an operation was deleted", async () => {
    await transactionRepository.deleteTransaction(testTransaction.id);
    await expect(walletRepository.reconcileBalance(input)).rejects.toBeInstanceOf(WalletBalanceChangedError);
    expect((await financeDb.wallets.get(wallet.id))?.balanceReconciliations).toBeUndefined();
  });

  it("keeps correction history through backup export and import and ordinary wallet edits", async () => {
    const reconciled = await walletRepository.reconcileBalance(input);
    const updated = await walletRepository.updateWallet(wallet.id, { name: "Renamed wallet" });
    expect(updated.balanceReconciliations).toEqual(reconciled.balanceReconciliations);
    await expect(walletRepository.updateWallet(wallet.id, { currency: "EUR" })).rejects.toThrow("Currency cannot be changed");
    const backup = await backupRepository.exportBackup();
    await financeDb.wallets.clear();
    await backupRepository.importBackup(backup);
    const restored = await financeDb.wallets.get(wallet.id);
    expect(restored?.balanceReconciliations).toEqual(reconciled.balanceReconciliations);
    expect(calculateWalletTotals(restored!, await transactionRepository.listTransactions(), []).balanceMinor).toBe(9000);
  });
});
