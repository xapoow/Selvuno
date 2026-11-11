import type { WalletTransfer, WalletTransferInput } from "@selvuno/types";
import { walletTransferInputSchema } from "@selvuno/types";
import { createEntityBase, financeDb, nowIso } from "../db/database";

export interface WalletTransferRepository {
  createTransfer(input: WalletTransferInput): Promise<WalletTransfer>;
  deleteTransfer(id: string): Promise<void>;
  listTransfers(options?: { includeDeleted?: boolean }): Promise<WalletTransfer[]>;
}

export const walletTransferRepository: WalletTransferRepository = {
  async createTransfer(input) {
    const parsed = walletTransferInputSchema.parse(input);
    const [fromWallet, toWallet] = await Promise.all([
      financeDb.wallets.get(parsed.fromWalletId),
      financeDb.wallets.get(parsed.toWalletId)
    ]);

    if (!fromWallet || fromWallet.deletedAt || fromWallet.archivedAt) {
      throw new Error("Source wallet is unavailable.");
    }
    if (!toWallet || toWallet.deletedAt || toWallet.archivedAt) {
      throw new Error("Destination wallet is unavailable.");
    }

    const transfer: WalletTransfer = {
      ...createEntityBase(),
      ...parsed,
      fromCurrency: fromWallet.currency.toUpperCase(),
      toCurrency: toWallet.currency.toUpperCase()
    };
    await financeDb.walletTransfers.add(transfer);
    return transfer;
  },

  async deleteTransfer(id) {
    const current = await financeDb.walletTransfers.get(id);
    if (!current || current.deletedAt) {
      return;
    }
    const now = nowIso();
    await financeDb.walletTransfers.put({
      ...current,
      deletedAt: now,
      updatedAt: now,
      syncStatus: "pending"
    });
  },

  async listTransfers(options) {
    const transfers = await financeDb.walletTransfers.orderBy("transferDate").reverse().toArray();
    return options?.includeDeleted
      ? transfers
      : transfers.filter((transfer) => !transfer.deletedAt);
  }
};
