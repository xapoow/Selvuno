import { beforeEach, describe, expect, it } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { testCategory, testTransaction, testWallet } from "../test/fixtures";
import { transactionRepository } from "./transactionRepository";

beforeEach(async () => {
  await resetDatabaseForTests();
  await financeDb.wallets.put(testWallet);
  await financeDb.categories.put(testCategory);
  await financeDb.transactions.put({ ...testTransaction, attachmentCount: 1 });
});

describe("transaction trash persistence", () => {
  it("restores the original record and receipt after deletion and a database reopen", async () => {
    await financeDb.transactionAttachments.add({
      id: "receipt", transactionId: testTransaction.id, name: "receipt.jpg", mimeType: "image/jpeg",
      blob: new NodeBlob(["receipt-data"], { type: "image/jpeg" }) as Blob, size: 12, createdAt: testTransaction.createdAt
    });
    const deleted = await transactionRepository.deleteTransactions([testTransaction.id]);
    expect(await transactionRepository.listTransactions()).toHaveLength(0);
    expect(await transactionRepository.listDeletedTransactions()).toEqual([expect.objectContaining({ id: testTransaction.id, deletedAt: deleted[0].deletedAt })]);
    financeDb.close();
    await financeDb.open();
    await transactionRepository.restoreTransactions(deleted);
    expect(await transactionRepository.listTransactions()).toEqual([expect.objectContaining({
      id: testTransaction.id, amountMinor: testTransaction.amountMinor, attachmentCount: 1, deletedAt: null
    })]);
    const receipt = await financeDb.transactionAttachments.get("receipt");
    expect(receipt?.transactionId).toBe(testTransaction.id);
    expect(receipt?.blob.size).toBe(12);
    expect(await receipt?.blob.text()).toBe("receipt-data");
    expect(await transactionRepository.listDeletedTransactions()).toHaveLength(0);
  });

  it("deletes and restores multiple records together, skipping duplicate delete requests", async () => {
    const second = { ...testTransaction, id: "30000000-0000-4000-8000-000000000002" };
    await financeDb.transactions.add(second);
    const [firstDelete, duplicate] = await Promise.all([
      transactionRepository.deleteTransactions([testTransaction.id, second.id, second.id]),
      transactionRepository.deleteTransactions([testTransaction.id])
    ]);
    expect(firstDelete).toHaveLength(2);
    expect(duplicate).toHaveLength(0);
    await transactionRepository.restoreTransactions(firstDelete);
    await transactionRepository.restoreTransactions(firstDelete);
    expect(await transactionRepository.listTransactions()).toHaveLength(2);
  });

  it("rejects stale undo tokens atomically rather than undoing a more recent deletion", async () => {
    const second = { ...testTransaction, id: "30000000-0000-4000-8000-000000000002" };
    await financeDb.transactions.add(second);
    const deleted = await transactionRepository.deleteTransactions([testTransaction.id, second.id]);
    await financeDb.transactions.update(second.id, { deletedAt: "2030-01-01T12:00:00.000Z" });
    await expect(transactionRepository.restoreTransactions(deleted)).rejects.toThrow("changed since deletion");
    expect(await transactionRepository.listTransactions()).toHaveLength(0);
    expect((await financeDb.transactions.get(testTransaction.id))?.deletedAt).toBe(deleted[0].deletedAt);
  });
});
