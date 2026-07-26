import Dexie, { type Table } from "dexie";
import type { Category, MonthlyBudget, Settings, Transaction, Wallet } from "@myfinances/types";
import { DEFAULT_CURRENCY, detectDefaultLocaleSettings, inferCurrencyFromLocale } from "@myfinances/utils";

const DEFAULT_LOCALE = "ru-RU";

export class FinanceDatabase extends Dexie {
  wallets!: Table<Wallet, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<Settings, string>;
  budgets!: Table<MonthlyBudget, string>;

  constructor(name = "myfinances") {
    super(name);
    this.version(1).stores({
      wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
      categories: "id, name, type, deletedAt, updatedAt",
      transactions: "id, walletId, categoryId, type, transactionDate, deletedAt, updatedAt",
      settings: "id"
    });
    this.version(2).stores({
      wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
      categories: "id, name, type, deletedAt, updatedAt",
      transactions: "id, walletId, categoryId, type, transactionDate, deletedAt, updatedAt",
      settings: "id",
      budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt"
    });
  }
}

export const financeDb = new FinanceDatabase();

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(): string {
  return crypto.randomUUID();
}

export function createEntityBase() {
  const now = nowIso();
  return {
    id: createId(),
    userId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncStatus: "local" as const
  };
}

const expenseCategories = [
  ["Groceries", "#207a6f", "shopping-basket"],
  ["Transport", "#3f73c9", "car"],
  ["Home", "#b7791f", "home"],
  ["Dining", "#c44a42", "utensils"],
  ["Health", "#7b61ff", "heart-pulse"]
] as const;

const incomeCategories = [
  ["Salary", "#1f8f66", "briefcase"],
  ["Freelance", "#3f73c9", "laptop"],
  ["Gifts", "#b7791f", "gift"]
] as const;

function getBrowserLocale(): string | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator.languages?.[0] ?? navigator.language;
}

export async function seedLocalData(db = financeDb): Promise<void> {
  const settings = await db.settings.get("default");
  const browserLocale = getBrowserLocale();
  const defaults = detectDefaultLocaleSettings(browserLocale);
  const previousAutoCurrency = inferCurrencyFromLocale(browserLocale);
  const now = nowIso();
  const shouldMigrateDefaultCurrency = !settings || !settings.defaultsVersion || settings.defaultsVersion < 2;

  if (!settings) {
    await db.settings.put({
      id: "default",
      locale: DEFAULT_LOCALE,
      currency: DEFAULT_CURRENCY,
      dateFormat: defaults.dateFormat,
      timeZone: defaults.timeZone,
      theme: "system",
      colorTheme: "sage",
      activeWalletId: "all",
      onboardingCompleted: false,
      defaultsVersion: 2,
      createdAt: now,
      updatedAt: now
    });
  } else {
    const repairedSettings: Partial<Settings> = {};
    if (!settings.locale) {
      repairedSettings.locale = defaults.locale;
    }
    if (!settings.currency) {
      repairedSettings.currency = DEFAULT_CURRENCY;
    }
    if (shouldMigrateDefaultCurrency) {
      repairedSettings.currency = DEFAULT_CURRENCY;
      repairedSettings.defaultsVersion = 2;
    }
    if (!settings.dateFormat) {
      repairedSettings.dateFormat = defaults.dateFormat;
    }
    if (!settings.timeZone) {
      repairedSettings.timeZone = defaults.timeZone;
    }
    if (!settings.theme) {
      repairedSettings.theme = "system";
    }
    if (!settings.colorTheme) {
      repairedSettings.colorTheme = "sage";
    }
    if (!settings.activeWalletId) {
      repairedSettings.activeWalletId = "all";
    }
    if (typeof settings.onboardingCompleted !== "boolean") {
      repairedSettings.onboardingCompleted = true;
    }
    if (!settings.defaultsVersion) {
      repairedSettings.defaultsVersion = 2;
    }
    if (Object.keys(repairedSettings).length) {
      await db.settings.put({
        ...settings,
        ...repairedSettings,
        updatedAt: now
      });
    }
  }

  if ((await db.wallets.count()) === 0) {
    await db.wallets.add({
      ...createEntityBase(),
      name: "Everyday",
      currency: DEFAULT_CURRENCY,
      archivedAt: null
    });
  }

  const wallets = await db.wallets.toArray();
  await Promise.all(
    wallets
      .filter(
        (wallet) =>
          !wallet.currency ||
          (shouldMigrateDefaultCurrency &&
            wallet.name === "Everyday" &&
            (wallet.currency === previousAutoCurrency || wallet.currency !== DEFAULT_CURRENCY))
      )
      .map((wallet) =>
        db.wallets.put({
          ...wallet,
          currency: DEFAULT_CURRENCY,
          updatedAt: now
        })
      )
  );

  const repairedWallets = await db.wallets.toArray();
  const walletCurrencyById = new Map(repairedWallets.map((wallet) => [wallet.id, wallet.currency]));
  const transactions = await db.transactions.toArray();
  await Promise.all(
    transactions
      .filter((transaction) => !transaction.currency || !Array.isArray((transaction as Partial<Transaction>).tags))
      .map((transaction) =>
        db.transactions.put({
          ...transaction,
          currency: transaction.currency ?? walletCurrencyById.get(transaction.walletId) ?? DEFAULT_CURRENCY,
          tags: Array.isArray((transaction as Partial<Transaction>).tags) ? transaction.tags : [],
          updatedAt: now
        })
      )
  );

  if ((await db.categories.count()) === 0) {
    await db.categories.bulkAdd([
      ...expenseCategories.map(
        ([name, color, icon]): Category => ({
          ...createEntityBase(),
          name,
          color,
          icon,
          type: "expense"
        })
      ),
      ...incomeCategories.map(
        ([name, color, icon]): Category => ({
          ...createEntityBase(),
          name,
          color,
          icon,
          type: "income"
        })
      )
    ]);
  }
}

export async function resetDatabaseForTests(db = financeDb): Promise<void> {
  await db.delete();
  await db.open();
}
