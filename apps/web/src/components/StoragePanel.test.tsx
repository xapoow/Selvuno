import { Blob as NativeBlob, File as NativeFile } from "node:buffer";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financeDb, resetDatabaseForTests } from "../db/database";
import { getDictionary } from "../i18n";
import { readStorageInfo } from "../lib/storageInfo";
import { backupRepository } from "../repositories/backupRepository";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { StoragePanel } from "./StoragePanel";

const t = getDictionary("en-US");
const originalStorage = Object.getOwnPropertyDescriptor(navigator, "storage");
beforeEach(async () => {
  vi.stubGlobal("Blob", NativeBlob); vi.stubGlobal("File", NativeFile);
  Object.defineProperty(navigator, "storage", { configurable: true, value: undefined });
  await resetDatabaseForTests();
  await financeDb.settings.put(testSettings); await financeDb.wallets.put(testWallet);
  await financeDb.categories.put(testCategory); await financeDb.transactions.put({ ...testTransaction, attachmentCount: 2 });
  await financeDb.transactionAttachments.bulkPut(["receipt.jpg", "invoice.pdf"].map((name, index) => {
    const blob = new Blob(["file"], { type: index ? "application/pdf" : "image/jpeg" });
    return { id: `file-${index}`, transactionId: testTransaction.id, name, size: blob.size, mimeType: blob.type, createdAt: testTransaction.createdAt, blob };
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (originalStorage) Object.defineProperty(navigator, "storage", originalStorage);
  else Reflect.deleteProperty(navigator, "storage");
});

describe("storage controls", () => {
  it("clears only unfinished drafts after confirmation", async () => {
    await financeDb.transactionDrafts.put({ id: "unfinished", updatedAt: new Date().toISOString(), files: [],
      fields: { type: "expense", walletId: testWallet.id, currency: "USD", categoryId: testCategory.id, amount: "5", date: "2026-11-11", note: "", tagsInput: "" } });
    const user = userEvent.setup();
    render(<StoragePanel t={t} locale="en-US" />);
    await screen.findByText("receipt.jpg");
    await user.click(screen.getByRole("button", { name: t.safety.clearDrafts }));
    expect(await financeDb.transactionDrafts.count()).toBe(1);
    await user.click(within(screen.getByRole("dialog", { name: t.safety.clearDrafts })).getByRole("button", { name: t.safety.delete }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await financeDb.transactionDrafts.count()).toBe(0);
    expect(await financeDb.transactionAttachments.count()).toBe(2);
    expect(await financeDb.transactions.get(testTransaction.id)).toBeDefined();
  });
  it("works without optional browser storage APIs", async () => {
    render(<StoragePanel t={t} locale="en-US" />);
    expect(await screen.findByText("receipt.jpg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.safety.requestProtection })).toBeDisabled();
    expect(screen.getByText(t.safety.unsupported)).toBeInTheDocument();
    expect((await readStorageInfo()).fileBytes).toBe(8);
  });

  it("requests persistent storage only on demand and explains a denial", async () => {
    const persist = vi.fn().mockResolvedValue(false);
    Object.defineProperty(navigator, "storage", { configurable: true, value: {
      persisted: vi.fn().mockResolvedValue(false), persist, estimate: vi.fn().mockResolvedValue({ usage: 1024, quota: 2048 })
    } });
    const user = userEvent.setup();
    render(<StoragePanel t={t} locale="en-US" />);
    await screen.findByText("receipt.jpg");
    expect(persist).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: t.safety.requestProtection }));
    expect(await screen.findByText(t.safety.persistenceDenied)).toBeInTheDocument();
    expect(persist).toHaveBeenCalledOnce();
    expect(screen.getByText(t.safety.unprotected)).toBeInTheDocument();
  });

  it("confirms file deletion, updates even a trashed operation, and retains restore copies", async () => {
    await backupRepository.createSnapshot();
    await financeDb.transactions.update(testTransaction.id, { deletedAt: new Date().toISOString() });
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StoragePanel t={t} locale="en-US" onChange={onChange} />);
    await screen.findByText("receipt.jpg");
    await user.click(screen.getByRole("button", { name: `${t.safety.deleteFile}: receipt.jpg` }));
    const dialog = screen.getByRole("dialog", { name: t.safety.deleteFile });
    expect(await financeDb.transactionAttachments.count()).toBe(2);
    await user.click(within(dialog).getByRole("button", { name: t.safety.delete }));
    await waitFor(() => expect(screen.queryByText("receipt.jpg")).not.toBeInTheDocument());
    expect(await financeDb.transactionAttachments.get("file-0")).toBeUndefined();
    expect(await financeDb.transactionAttachments.get("file-1")).toBeDefined();
    expect(await financeDb.snapshotAttachments.get("file-0")).toBeDefined();
    expect(await financeDb.transactions.get(testTransaction.id)).toMatchObject({ attachmentCount: 1, deletedAt: expect.any(String) });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("clears restore history without removing transactions or live receipts", async () => {
    await backupRepository.createSnapshot();
    const user = userEvent.setup();
    render(<StoragePanel t={t} locale="en-US" />);
    await screen.findByText("receipt.jpg");
    await user.click(screen.getByRole("button", { name: t.safety.clearHistory }));
    await user.click(within(screen.getByRole("dialog", { name: t.safety.clearHistory })).getByRole("button", { name: t.safety.delete }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await financeDb.backupSnapshots.count()).toBe(0);
    expect(await financeDb.snapshotAttachments.count()).toBe(0);
    expect(await financeDb.transactionAttachments.count()).toBe(2);
    expect(await financeDb.transactions.get(testTransaction.id)).toBeDefined();
  });
});
