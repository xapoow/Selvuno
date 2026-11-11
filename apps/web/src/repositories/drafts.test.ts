import { Blob as NativeBlob, File as NativeFile } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financeDb, resetDatabaseForTests, seedLocalData } from "../db/database";
import { draftRepository } from "./draftRepository";
import { testCategory, testSettings, testWallet } from "../test/fixtures";

beforeEach(async () => {
  vi.stubGlobal("Blob", NativeBlob); vi.stubGlobal("File", NativeFile);
  await resetDatabaseForTests(); await financeDb.settings.put(testSettings);
});
afterEach(() => vi.unstubAllGlobals());
const fields = { type: "expense" as const, walletId: testWallet.id, currency: "USD", categoryId: testCategory.id, amount: "12+3", date: "2026-11-11", note: "Receipt note", tagsInput: "groceries" };
describe("local transaction drafts", () => {
  it("rejects invalid draft files before writing to storage", async () => {
    const record = { id: "new-entry:test", updatedAt: new Date().toISOString(), fields,
      files: [{ name: "unsafe.html", type: "text/html", lastModified: 123, blob: new Blob(["unsafe"], { type: "text/html" }) }] };
    expect(() => draftRepository.save(record)).toThrow("draft-invalid");
    expect(await financeDb.transactionDrafts.count()).toBe(0);
  });
  it("persists draft fields and raw file bytes through a database reopen", async () => {
    const record = { id: "new-entry:test", updatedAt: new Date().toISOString(), fields, files: [{ name: "receipt.jpg", type: "image/jpeg", lastModified: 123, blob: new Blob(["receipt"], { type: "image/jpeg" }) }] };
    await draftRepository.save(record); financeDb.close(); await financeDb.open();
    const restored = await draftRepository.read(record.id);
    expect(restored?.fields).toEqual(fields);
    expect(await restored?.files[0].blob.text()).toBe("receipt");
  });
  it("serializes deletion after pending writes so completed drafts cannot reappear", async () => {
    const record = { id: "new-entry:test", updatedAt: new Date().toISOString(), fields, files: [] };
    await Promise.all([draftRepository.save(record), draftRepository.save({ ...record, fields: { ...fields, amount: "99" } }), draftRepository.remove(record.id)]);
    expect(await draftRepository.read(record.id)).toBeNull();
  });
  it("does not store edits when the user has opted out", async () => {
    await financeDb.settings.update("default", { draftsEnabled: false });
    await draftRepository.save({ id: "new-entry:test", updatedAt: new Date().toISOString(), fields, files: [] });
    expect(await financeDb.transactionDrafts.count()).toBe(0);
  });
  it("expires old drafts on app access without deleting recent ones", async () => {
    await financeDb.transactionDrafts.put({ id: "old", updatedAt: "2000-01-01T00:00:00.000Z", fields, files: [] });
    await draftRepository.save({ id: "recent", updatedAt: new Date().toISOString(), fields, files: [] });
    await seedLocalData();
    expect(await financeDb.transactionDrafts.get("old")).toBeUndefined();
    expect(await draftRepository.read("recent")).not.toBeNull();
  });
});
