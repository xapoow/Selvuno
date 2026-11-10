import type { Wallet, WalletInput, WalletReconciliationInput } from "@selvuno/types";
import { balanceReconciliationSchema, walletInputSchema, walletReconciliationInputSchema } from "@selvuno/types";
import { calculateWalletTotals } from "@selvuno/utils";
import { createEntityBase, createId, financeDb, nowIso } from "../db/database";
import { WalletBalanceChangedError } from "../lib/walletReconciliation";

export interface WalletRepository {
  createWallet(input: WalletInput): Promise<Wallet>;
  updateWallet(id: string, input: Partial<WalletInput>): Promise<Wallet>;
  archiveWallet(id: string): Promise<void>;
  restoreWallet(id: string): Promise<Wallet>;
  reorderWallets(orderedIds: string[]): Promise<void>;
  listWallets(options?: { includeArchived?: boolean }): Promise<Wallet[]>;
  reconcileBalance(input: WalletReconciliationInput): Promise<Wallet>;
}

export const walletRepository: WalletRepository = {
  async createWallet(input) {
    const parsed = walletInputSchema.parse({
      ...input,
      currency: input.currency.toUpperCase()
    });
    const existing = await financeDb.wallets.filter((w) => !w.deletedAt).toArray();
    const maxOrder = existing.reduce((max, w) => Math.max(max, w.sortOrder ?? 0), -1);
    const wallet: Wallet = {
      ...createEntityBase(),
      ...parsed,
      initialBalanceMinor: parsed.initialBalanceMinor ?? 0,
      kind: parsed.kind ?? "cash",
      creditLimitMinor: parsed.creditLimitMinor ?? 0,
      excludeFromTotals: parsed.excludeFromTotals ?? false,
      hideBalance: parsed.hideBalance ?? false,
      color: parsed.color ?? "#207a6f",
      icon: parsed.icon ?? "wallet-cards",
      archivedAt: null,
      sortOrder: parsed.sortOrder ?? maxOrder + 1
    };
    await financeDb.wallets.add(wallet);
    return wallet;
  },

  async updateWallet(id, input) {
    const current = await financeDb.wallets.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Wallet not found.");
    }
    if (input.currency && input.currency.toUpperCase() !== current.currency && current.balanceReconciliations?.length) {
      throw new Error("Currency cannot be changed after a balance reconciliation.");
    }
    const next: Wallet = {
      ...current,
      ...input,
      currency: input.currency?.toUpperCase() ?? current.currency,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    walletInputSchema.partial().parse({
      name: next.name,
      currency: next.currency,
      initialBalanceMinor: next.initialBalanceMinor,
      kind: next.kind,
      creditLimitMinor: next.creditLimitMinor,
      excludeFromTotals: next.excludeFromTotals,
      hideBalance: next.hideBalance,
      color: next.color,
      icon: next.icon,
      sortOrder: next.sortOrder
    });
    await financeDb.transaction(
      "rw",
      [
        financeDb.wallets,
        financeDb.transactions,
        financeDb.transactionTemplates,
        financeDb.recurringTransactions,
        financeDb.savingsGoals,
        financeDb.walletTransfers
      ],
      async () => {
        const latest = await financeDb.wallets.get(id);
        if (!latest || latest.updatedAt !== current.updatedAt ||
          (latest.balanceReconciliations?.length ?? 0) !== (current.balanceReconciliations?.length ?? 0)) {
          throw new WalletBalanceChangedError();
        }
        await financeDb.wallets.put(next);
        if (next.currency !== current.currency) {
          const transactions = await financeDb.transactions.where("walletId").equals(id).toArray();
          const recurringTransactions = await financeDb.recurringTransactions
            .where("walletId")
            .equals(id)
            .toArray();
          const transactionTemplates = await financeDb.transactionTemplates
            .where("walletId")
            .equals(id)
            .toArray();
          const savingsGoals = await financeDb.savingsGoals.where("walletId").equals(id).toArray();
          const [outgoingTransfers, incomingTransfers] = await Promise.all([
            financeDb.walletTransfers.where("fromWalletId").equals(id).toArray(),
            financeDb.walletTransfers.where("toWalletId").equals(id).toArray()
          ]);
          await Promise.all([
            ...transactions.map((transaction) =>
              financeDb.transactions.put({
                ...transaction,
                currency: next.currency,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            ),
            ...recurringTransactions.map((schedule) =>
              financeDb.recurringTransactions.put({
                ...schedule,
                currency: next.currency,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            ),
            ...transactionTemplates.map((template) =>
              financeDb.transactionTemplates.put({
                ...template,
                currency: next.currency,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            ),
            ...savingsGoals.map((goal) =>
              financeDb.savingsGoals.put({
                ...goal,
                currency: next.currency,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            ),
            ...outgoingTransfers.map((transfer) =>
              financeDb.walletTransfers.put({
                ...transfer,
                fromCurrency: next.currency,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            ),
            ...incomingTransfers.map((transfer) =>
              financeDb.walletTransfers.put({
                ...transfer,
                toCurrency: next.currency,
                updatedAt: next.updatedAt,
                syncStatus: "pending"
              })
            )
          ]);
        }
      }
    );
    return next;
  },

  async reconcileBalance(input) {
    const parsed = walletReconciliationInputSchema.parse(input);
    return financeDb.transaction("rw", [financeDb.wallets, financeDb.transactions, financeDb.walletTransfers], async () => {
      const wallet = await financeDb.wallets.get(parsed.walletId);
      if (!wallet || wallet.deletedAt || wallet.archivedAt) throw new Error("Active wallet not found.");
      const transactions = await financeDb.transactions.where("walletId").equals(wallet.id).toArray();
      const transfers = await financeDb.walletTransfers.filter((item) => item.fromWalletId === wallet.id || item.toWalletId === wallet.id).toArray();
      const currentBalance = calculateWalletTotals(wallet, transactions, transfers).balanceMinor;
      if (parsed.currency !== wallet.currency || currentBalance !== parsed.expectedBalanceMinor) throw new WalletBalanceChangedError();
      const now = nowIso();
      const reconciliation = balanceReconciliationSchema.parse({
        id: createId(), createdAt: now, currency: wallet.currency,
        expectedBalanceMinor: currentBalance, actualBalanceMinor: parsed.actualBalanceMinor,
        adjustmentMinor: parsed.actualBalanceMinor - currentBalance,
        note: parsed.note?.trim() || undefined
      });
      const next: Wallet = {
        ...wallet, balanceReconciliations: [...(wallet.balanceReconciliations ?? []), reconciliation],
        updatedAt: now, syncStatus: "pending"
      };
      await financeDb.wallets.put(next);
      return next;
    });
  },

  async archiveWallet(id) {
    const current = await financeDb.wallets.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const activeWalletCount = await financeDb.wallets
      .filter((wallet) => !wallet.deletedAt && !wallet.archivedAt)
      .count();
    if (activeWalletCount <= 1) {
      throw new Error("The last active wallet cannot be archived.");
    }
    const now = nowIso();
    await financeDb.transaction(
      "rw",
      [financeDb.wallets, financeDb.recurringTransactions],
      async () => {
        const latest = await financeDb.wallets.get(id);
        if (!latest || latest.deletedAt) return;
        await financeDb.wallets.put({
          ...latest,
          archivedAt: now,
          updatedAt: now,
          syncStatus: "pending"
        });
        const recurringTransactions = await financeDb.recurringTransactions.where("walletId").equals(id).toArray();
        await Promise.all(
          recurringTransactions.map((schedule) =>
            financeDb.recurringTransactions.put({
              ...schedule,
              paused: true,
              updatedAt: now,
              syncStatus: "pending"
            })
          )
        );
      }
    );
  },

  async restoreWallet(id) {
    return financeDb.transaction("rw", financeDb.wallets, async () => {
      const current = await financeDb.wallets.get(id);
      if (!current || current.deletedAt) throw new Error("Wallet not found.");
      const restored: Wallet = { ...current, archivedAt: null, updatedAt: nowIso(), syncStatus: "pending" };
      await financeDb.wallets.put(restored);
      return restored;
    });
  },

  async reorderWallets(orderedIds) {
    const activeWallets = (await financeDb.wallets.toArray()).filter(
      (wallet) => !wallet.deletedAt && !wallet.archivedAt
    );
    const activeIds = new Set(activeWallets.map((wallet) => wallet.id));
    if (
      orderedIds.length !== activeWallets.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some((id) => !activeIds.has(id))
    ) {
      throw new Error("Wallet order does not match the active wallet list.");
    }

    const now = nowIso();
    await financeDb.transaction("rw", financeDb.wallets, async () => {
      await Promise.all(
        orderedIds.map(async (id, sortOrder) => {
          const wallet = await financeDb.wallets.get(id);
          if (wallet) {
            await financeDb.wallets.put({
              ...wallet,
              sortOrder,
              updatedAt: now,
              syncStatus: "pending"
            });
          }
        })
      );
    });
  },

  async listWallets(options) {
    const wallets = await financeDb.wallets.toArray();
    return wallets
      .filter((wallet) => {
        if (wallet.deletedAt) {
          return false;
        }
        if (!options?.includeArchived && wallet.archivedAt) {
          return false;
        }
        return true;
      })
      .sort(
        (left, right) =>
          (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
          left.createdAt.localeCompare(right.createdAt)
      );
  }
};
