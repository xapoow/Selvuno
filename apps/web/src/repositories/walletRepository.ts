import type { Wallet, WalletInput } from "@myfinances/types";
import { walletInputSchema } from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface WalletRepository {
  createWallet(input: WalletInput): Promise<Wallet>;
  updateWallet(id: string, input: Partial<WalletInput>): Promise<Wallet>;
  archiveWallet(id: string): Promise<void>;
  restoreWallet(id: string): Promise<Wallet>;
  listWallets(options?: { includeArchived?: boolean }): Promise<Wallet[]>;
}

export const walletRepository: WalletRepository = {
  async createWallet(input) {
    const parsed = walletInputSchema.parse({
      ...input,
      currency: input.currency.toUpperCase()
    });
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
      archivedAt: null
    };
    await financeDb.wallets.add(wallet);
    return wallet;
  },

  async updateWallet(id, input) {
    const current = await financeDb.wallets.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Wallet not found.");
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
      icon: next.icon
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
        await financeDb.wallets.put({
          ...current,
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
    const current = await financeDb.wallets.get(id);
    if (!current || current.deletedAt) {
      throw new Error("Wallet not found.");
    }
    const restored: Wallet = {
      ...current,
      archivedAt: null,
      updatedAt: nowIso(),
      syncStatus: "pending"
    };
    await financeDb.wallets.put(restored);
    return restored;
  },

  async listWallets(options) {
    const wallets = await financeDb.wallets.orderBy("updatedAt").reverse().toArray();
    return wallets.filter((wallet) => {
      if (wallet.deletedAt) {
        return false;
      }
      if (!options?.includeArchived && wallet.archivedAt) {
        return false;
      }
      return true;
    });
  }
};
