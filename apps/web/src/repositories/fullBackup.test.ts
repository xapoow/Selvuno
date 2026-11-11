import { Blob as NativeBlob, File as NativeFile } from "node:buffer";
import { strToU8, unzipSync, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { blobBytes, createBackupArchive, readBackupFile } from "../lib/backupArchive";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { backupRepository } from "./backupRepository";

beforeEach(async () => {
  vi.stubGlobal("Blob", NativeBlob); vi.stubGlobal("File", NativeFile);
  await resetDatabaseForTests();
  await financeDb.settings.put(testSettings); await financeDb.wallets.put(testWallet);
  await financeDb.categories.put(testCategory);
  await financeDb.transactions.put({ ...testTransaction, attachmentCount: 1 });
  const blob = new Blob(["receipt bytes"], { type: "image/jpeg" });
  await financeDb.transactionAttachments.put({ id: "receipt-1", transactionId: testTransaction.id, name: "receipt.jpg", size: blob.size, mimeType: blob.type, createdAt: testTransaction.createdAt, blob });
});
afterEach(() => vi.unstubAllGlobals());

describe("full backup safety", () => {
  it("accepts a standard deflated ZIP without relying on stored-only encoding", async () => {
    const archive = await blobBytes(await backupRepository.exportArchive());
    const zipped = zipSync(unzipSync(archive));
    const prepared = await readBackupFile(new Blob([Uint8Array.from(zipped).buffer]));
    expect("kind" in prepared).toBe(true);
  });
  it("round trips a ZIP archive, receipt bytes and settings on an empty database", async () => {
    const archive = await backupRepository.exportArchive();
    const prepared = await readBackupFile(archive);
    expect("kind" in prepared).toBe(true);
    await resetDatabaseForTests();
    await backupRepository.importBackup(prepared);
    expect(await financeDb.wallets.get(testWallet.id)).toEqual(testWallet);
    expect(await financeDb.transactions.get(testTransaction.id)).toMatchObject({ amountMinor: 1250, attachmentCount: 1 });
    const file = (await financeDb.transactionAttachments.toArray())[0];
    expect(new TextDecoder().decode(await blobBytes(file.blob))).toBe("receipt bytes");
    expect((await financeDb.backupSnapshots.toArray()).some((item) => item.reason === "before-restore")).toBe(true);
  });
  it("retains matching local files when a legacy JSON backup is restored", async () => {
    const json = await backupRepository.exportBackup();
    await backupRepository.importBackup(JSON.parse(JSON.stringify(json)));
    expect(await financeDb.transactionAttachments.count()).toBe(1);
    expect((await financeDb.transactions.get(testTransaction.id))?.attachmentCount).toBe(1);
  });
  it("corrects attachment counts when a legacy backup has no available file bytes", async () => {
    const json = await backupRepository.exportBackup();
    await financeDb.transactionAttachments.clear();
    await backupRepository.importBackup(json);
    expect((await financeDb.transactions.get(testTransaction.id))?.attachmentCount).toBe(0);
  });
  it("preserves and deduplicates snapshot files, then restores a removed receipt", async () => {
    const snapshot = await backupRepository.createSnapshot();
    await backupRepository.createSnapshot();
    expect(await financeDb.snapshotAttachments.count()).toBe(1);
    await financeDb.transactionAttachments.clear();
    await backupRepository.restoreSnapshot(snapshot.id);
    expect(await financeDb.transactionAttachments.count()).toBe(1);
    expect(new TextDecoder().decode(await blobBytes((await financeDb.transactionAttachments.toArray())[0].blob))).toBe("receipt bytes");
  });
  it("garbage collects only copies no longer referenced by restore history", async () => {
    const snapshot = await backupRepository.createSnapshot();
    await backupRepository.deleteSnapshot(snapshot.id);
    expect(await financeDb.snapshotAttachments.count()).toBe(0);
    expect(await financeDb.transactionAttachments.count()).toBe(1);
  });
  it("rejects altered or missing files and truncated ZIPs before touching the database", async () => {
    const archive = await blobBytes(await backupRepository.exportArchive());
    const altered = unzipSync(archive);
    altered["files/receipt-1"] = strToU8("corrupt");
    await expect(readBackupFile(new Blob([Uint8Array.from(zipSync(altered)).buffer]))).rejects.toThrow(/archive-(incomplete|invalid)/);
    delete altered["files/receipt-1"];
    await expect(readBackupFile(new Blob([Uint8Array.from(zipSync(altered)).buffer]))).rejects.toThrow("archive-incomplete");
    await expect(readBackupFile(new Blob([archive.slice(0, -5).buffer]))).rejects.toThrow("archive-invalid");
    expect(await financeDb.transactionAttachments.count()).toBe(1);
    expect(await financeDb.backupSnapshots.count()).toBe(0);
  });
  it("rejects unsafe ZIP paths and over-limit advertised files", async () => {
    await expect(readBackupFile(new Blob([Uint8Array.from(zipSync({ "../outside": strToU8("bad") })).buffer]))).rejects.toThrow("archive-invalid");
    const blob = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: "image/jpeg" });
    const file = { ...(await financeDb.transactionAttachments.toArray())[0], blob, size: blob.size };
    await expect(createBackupArchive({ data: await backupRepository.exportBackup(), attachments: [file] })).rejects.toThrow();
  });
  it("fails atomically if a snapshot file is missing and retains current data", async () => {
    const snapshot = await backupRepository.createSnapshot();
    await financeDb.snapshotAttachments.clear();
    await expect(backupRepository.restoreSnapshot(snapshot.id)).rejects.toThrow("archive-incomplete");
    expect(await financeDb.transactionAttachments.count()).toBe(1);
    expect((await financeDb.transactions.get(testTransaction.id))?.amountMinor).toBe(1250);
  });
});
