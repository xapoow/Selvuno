import html from "../../index.html?raw";
import config from "../../vite.config.ts?raw";
import { beforeEach, describe, expect, it } from "vitest";
import { FinanceDatabase, financeDb, resetDatabaseForTests } from "../db/database";
import { getDictionary } from "../i18n";
import { backupRepository } from "../repositories/backupRepository";
import { testCategory, testSettings, testTransaction, testWallet } from "../test/fixtures";
import { APP_NAME, EXPORT_PREFIX } from "./brand";
import { hasPinCredential, readPrivacyConfig, savePinCredential, verifyPinCredential } from "./privacy";

describe("Selvuno branding", () => {
  it.each(["en-US", "ru-RU"])("uses the new name throughout the %s dictionary", (locale) => {
    const t = getDictionary(locale);
    expect(t.brand).toBe(APP_NAME);
    expect(t.brand).toBe("Selvuno");
    expect(t.cookieNotice.body).toContain(APP_NAME);
    expect(t.notifications.updateTitle).toBe(`${APP_NAME} {version}`);
    expect(t.errors.bootTitle).toContain(APP_NAME);
    expect(JSON.stringify(t)).not.toMatch(/myfinances/i);
  });

  it("uses the same name on static startup screens and in the installed app manifest", () => {
    expect(html).toContain(`<title>${APP_NAME}</title>`);
    expect(html).toContain(`name="apple-mobile-web-app-title" content="${APP_NAME}"`);
    expect(html).not.toContain("MyFinances");
    expect(config).toMatch(/name:\s*APP_NAME/);
    expect(config).toMatch(/short_name:\s*APP_NAME/);
    expect(config).toMatch(/id:\s*"\/"/);
    expect(config).toMatch(/scope:\s*"\/"/);
    expect(config).toMatch(/start_url:\s*"\/"/);
  });

  it("uses Selvuno for new exported filenames", () => {
    expect(EXPORT_PREFIX).toBe("selvuno");
  });
});

describe("rebrand data compatibility", () => {
  beforeEach(async () => {
    localStorage.clear();
    await resetDatabaseForTests();
  });

  it("reads existing wallets, transactions and receipt files from the original database", async () => {
    const legacy = new FinanceDatabase("myfinances");
    try {
      await legacy.open();
      await legacy.wallets.put(testWallet);
      await legacy.categories.put(testCategory);
      await legacy.settings.put(testSettings);
      await legacy.transactions.put({ ...testTransaction, attachmentCount: 1 });
      await legacy.transactionAttachments.put({
        id: "receipt", transactionId: testTransaction.id, name: "receipt.jpg", mimeType: "image/jpeg",
        size: 7, blob: new Blob(["receipt"], { type: "image/jpeg" }), createdAt: testTransaction.createdAt
      });
    } finally { legacy.close(); }
    financeDb.close();
    await financeDb.open();
    expect(financeDb.name).toBe("myfinances");
    expect(await financeDb.wallets.get(testWallet.id)).toEqual(testWallet);
    expect(await financeDb.transactions.get(testTransaction.id)).toMatchObject({ amountMinor: testTransaction.amountMinor, attachmentCount: 1 });
    expect(await financeDb.transactionAttachments.get("receipt")).toMatchObject({ name: "receipt.jpg", transactionId: testTransaction.id, size: 7 });
  });

  it("imports and exports existing backup data without any brand-based format change", async () => {
    await financeDb.settings.put(testSettings);
    await financeDb.wallets.put(testWallet);
    await financeDb.categories.put(testCategory);
    await financeDb.transactions.put(testTransaction);
    const backup = await backupRepository.exportBackup();
    await backupRepository.importBackup(JSON.parse(JSON.stringify(backup)));
    expect(await financeDb.wallets.get(testWallet.id)).toEqual(testWallet);
    expect(await financeDb.transactions.get(testTransaction.id)).toEqual(testTransaction);
    expect((await backupRepository.exportBackup()).settings.locale).toBe(testSettings.locale);
  });

  it("retains the old PIN and privacy settings namespace", async () => {
    localStorage.setItem("myfinances:privacy-config:v1", JSON.stringify({ autoLockMinutes: 15 }));
    expect(readPrivacyConfig().autoLockMinutes).toBe(15);
    await savePinCredential("482601");
    expect(localStorage.getItem("myfinances:privacy-credential:v1")).not.toBeNull();
    expect(hasPinCredential()).toBe(true);
    await expect(verifyPinCredential("482601")).resolves.toBe(true);
  });
});
