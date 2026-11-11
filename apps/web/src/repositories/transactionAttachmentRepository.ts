import { createId, financeDb, nowIso } from "../db/database";
import type { TransactionAttachment } from "../db/models";
import {
  ATTACHMENT_MAX_FILES,
  validateAttachment
} from "../lib/transactionAttachments";

export interface TransactionAttachmentRepository {
  listByTransaction(transactionId: string): Promise<TransactionAttachment[]>;
  applyChanges(transactionId: string, newFiles: File[], removedIds: string[]): Promise<void>;
  removeFile(id: string): Promise<void>;
}

export const transactionAttachmentRepository: TransactionAttachmentRepository = {
  async removeFile(id) {
    // Storage management also needs to remove bytes retained by trashed operations.
    await financeDb.transaction("rw", financeDb.transactionAttachments, financeDb.transactions, async () => {
      const file = await financeDb.transactionAttachments.get(id);
      if (!file) return;
      await financeDb.transactionAttachments.delete(id);
      const attachmentCount = await financeDb.transactionAttachments.where("transactionId").equals(file.transactionId).count();
      await financeDb.transactions.update(file.transactionId, { attachmentCount, updatedAt: nowIso(), syncStatus: "pending" });
    });
  },
  async listByTransaction(transactionId) {
    return financeDb.transactionAttachments.where("transactionId").equals(transactionId).sortBy("createdAt");
  },

  async applyChanges(transactionId, newFiles, removedIds) {
    const transaction = await financeDb.transactions.get(transactionId);
    if (!transaction || transaction.deletedAt) {
      throw new Error("Transaction not found.");
    }
    for (const file of newFiles) {
      if (validateAttachment(file)) {
        throw new Error("Invalid attachment.");
      }
    }

    await financeDb.transaction(
      "rw",
      [financeDb.transactionAttachments, financeDb.transactions],
      async () => {
        if (removedIds.length) {
          const owned = await financeDb.transactionAttachments.bulkGet(removedIds);
          const safeIds = owned
            .filter((item): item is TransactionAttachment => Boolean(item?.transactionId === transactionId))
            .map((item) => item.id);
          await financeDb.transactionAttachments.bulkDelete(safeIds);
        }

        const currentCount = await financeDb.transactionAttachments
          .where("transactionId")
          .equals(transactionId)
          .count();
        if (currentCount + newFiles.length > ATTACHMENT_MAX_FILES) {
          throw new Error("Too many attachments.");
        }

        const createdAt = nowIso();
        if (newFiles.length) {
          await financeDb.transactionAttachments.bulkAdd(
            newFiles.map((file) => ({
              id: createId(),
              transactionId,
              name: file.name,
              mimeType: file.type,
              size: file.size,
              blob: file,
              createdAt
            }))
          );
        }
        const attachmentCount = currentCount + newFiles.length;
        await financeDb.transactions.update(transactionId, {
          attachmentCount,
          updatedAt: createdAt,
          syncStatus: "pending"
        });
      }
    );
  }
};
