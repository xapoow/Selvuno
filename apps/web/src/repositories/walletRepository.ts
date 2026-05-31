import type { Wallet, WalletInput } from "@myfinances/types";
import { walletInputSchema } from "@myfinances/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface WalletRepository {
  createWallet(input: WalletInput): Promise<Wallet>;
  updateWallet(id: string, input: Partial<WalletInput>): Promise<Wallet>;
  archiveWallet(id: string): Promise<void>;
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
      currency: next.currency
    });
    await financeDb.transaction("rw", financeDb.wallets, financeDb.transactions, async () => {
      await financeDb.wallets.put(next);
      if (next.currency !== current.currency) {
        const transactions = await financeDb.transactions.where("walletId").equals(id).toArray();
        await Promise.all(
          transactions.map((transaction) =>
            financeDb.transactions.put({
              ...transaction,
              currency: next.currency,
              updatedAt: next.updatedAt,
              syncStatus: "pending"
            })
          )
        );
      }
    });
    return next;
  },

  async archiveWallet(id) {
    const current = await financeDb.wallets.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.wallets.put({
      ...current,
      archivedAt: now,
      updatedAt: now,
      syncStatus: "pending"
    });
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
