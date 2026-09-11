import Dexie, { type Table } from "dexie";
import type {
  BackupSnapshot,
  Category,
  MonthlyBudget,
  RecurringTransaction,
  SavingsGoal,
  SavingsGoalContribution,
  Settings,
  Transaction,
  TransactionTemplate,
  Wallet,
  WalletTransfer
} from "@myfinances/types";
import { DEFAULT_CURRENCY, detectDefaultLocaleSettings, inferCurrencyFromLocale } from "@myfinances/utils";

const DEFAULT_LOCALE = "ru-RU";

export class FinanceDatabase extends Dexie {
  wallets!: Table<Wallet, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  transactionTemplates!: Table<TransactionTemplate, string>;
  settings!: Table<Settings, string>;
  budgets!: Table<MonthlyBudget, string>;
  recurringTransactions!: Table<RecurringTransaction, string>;
  savingsGoals!: Table<SavingsGoal, string>;
  savingsGoalContributions!: Table<SavingsGoalContribution, string>;
  walletTransfers!: Table<WalletTransfer, string>;
  backupSnapshots!: Table<BackupSnapshot, string>;

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
    this.version(3).stores({
      wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
      categories: "id, name, type, deletedAt, updatedAt",
      transactions:
        "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
      settings: "id",
      budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
      recurringTransactions:
        "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt"
    });
    this.version(4).stores({
      wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
      categories: "id, name, type, deletedAt, updatedAt",
      transactions:
        "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
      settings: "id",
      budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
      recurringTransactions:
        "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
      savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
      savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt"
    });
    this.version(5)
      .stores({
        wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
        categories: "id, name, type, deletedAt, updatedAt",
        transactions:
          "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
        settings: "id",
        budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
        recurringTransactions:
          "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
        savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
        savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt",
        walletTransfers:
          "id, fromWalletId, toWalletId, transferDate, deletedAt, updatedAt"
      })
      .upgrade((transaction) =>
        transaction
          .table("wallets")
          .toCollection()
          .modify((wallet: Partial<Wallet>) => {
            if (!Number.isInteger(wallet.initialBalanceMinor)) {
              wallet.initialBalanceMinor = 0;
            }
          })
      );
    this.version(6)
      .stores({
        wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
        categories: "id, name, type, deletedAt, updatedAt",
        transactions:
          "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
        settings: "id",
        budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
        recurringTransactions:
          "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
        savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
        savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt",
        walletTransfers:
          "id, fromWalletId, toWalletId, transferDate, deletedAt, updatedAt"
      })
      .upgrade((transaction) =>
        transaction
          .table("wallets")
          .toCollection()
          .modify((wallet: Partial<Wallet>) => {
            wallet.color ||= "#207a6f";
            wallet.icon ||= "wallet-cards";
          })
      );
    this.version(7)
      .stores({
        wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
        categories: "id, sortOrder, name, type, deletedAt, updatedAt",
        transactions:
          "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
        settings: "id",
        budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
        recurringTransactions:
          "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
        savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
        savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt",
        walletTransfers:
          "id, fromWalletId, toWalletId, transferDate, deletedAt, updatedAt"
      })
      .upgrade(async (transaction) => {
        const orderByType = new Map<string, number>();
        await transaction
          .table("categories")
          .toCollection()
          .modify((category: Partial<Category>) => {
            const type = category.type ?? "expense";
            const sortOrder = orderByType.get(type) ?? 0;
            if (!Number.isInteger(category.sortOrder)) {
              category.sortOrder = sortOrder;
            }
            orderByType.set(type, sortOrder + 1);
          });
      });
    this.version(8).stores({
      wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
      categories: "id, sortOrder, name, type, deletedAt, updatedAt",
      transactions:
        "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
      settings: "id",
      budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
      recurringTransactions:
        "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
      savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
      savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt",
      walletTransfers:
        "id, fromWalletId, toWalletId, transferDate, deletedAt, updatedAt",
      backupSnapshots: "id, createdAt, reason"
    });
    this.version(9).stores({
      wallets: "id, name, currency, archivedAt, deletedAt, updatedAt",
      categories: "id, sortOrder, name, type, deletedAt, updatedAt",
      transactions:
        "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
      transactionTemplates: "id, walletId, categoryId, type, sortOrder, deletedAt, updatedAt",
      settings: "id",
      budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
      recurringTransactions:
        "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
      savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
      savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt",
      walletTransfers:
        "id, fromWalletId, toWalletId, transferDate, deletedAt, updatedAt",
      backupSnapshots: "id, createdAt, reason"
    });
    this.version(10)
      .stores({
        wallets: "id, name, currency, kind, excludeFromTotals, archivedAt, deletedAt, updatedAt",
        categories: "id, sortOrder, name, type, deletedAt, updatedAt",
        transactions:
          "id, walletId, categoryId, type, transactionDate, recurringTransactionId, &[recurringTransactionId+recurrenceDate], deletedAt, updatedAt",
        transactionTemplates: "id, walletId, categoryId, type, sortOrder, deletedAt, updatedAt",
        settings: "id",
        budgets: "id, month, categoryId, [categoryId+month], deletedAt, updatedAt",
        recurringTransactions:
          "id, walletId, categoryId, type, frequency, nextRunDate, paused, deletedAt, updatedAt",
        savingsGoals: "id, walletId, targetDate, deletedAt, updatedAt",
        savingsGoalContributions: "id, goalId, contributionDate, deletedAt, updatedAt",
        walletTransfers:
          "id, fromWalletId, toWalletId, transferDate, deletedAt, updatedAt",
        backupSnapshots: "id, createdAt, reason"
      })
      .upgrade((transaction) =>
        transaction
          .table("wallets")
          .toCollection()
          .modify((wallet: Partial<Wallet>) => {
            wallet.kind ||= "cash";
            if (!Number.isInteger(wallet.creditLimitMinor)) {
              wallet.creditLimitMinor = 0;
            }
            if (typeof wallet.excludeFromTotals !== "boolean") {
              wallet.excludeFromTotals = false;
            }
            if (typeof wallet.hideBalance !== "boolean") {
              wallet.hideBalance = false;
            }
          })
      );
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
      hideAmounts: false,
      quickTemplatesEnabled: true,
      categorySuggestionsEnabled: false,
      addAnotherEnabled: true,
      advancedWalletsEnabled: false,
      smartInsightsEnabled: false,
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
    if (typeof settings.hideAmounts !== "boolean") {
      repairedSettings.hideAmounts = false;
    }
    if (typeof settings.quickTemplatesEnabled !== "boolean") {
      repairedSettings.quickTemplatesEnabled = true;
    }
    if (typeof settings.categorySuggestionsEnabled !== "boolean") {
      repairedSettings.categorySuggestionsEnabled = false;
    }
    if (typeof settings.addAnotherEnabled !== "boolean") {
      repairedSettings.addAnotherEnabled = true;
    }
    if (typeof settings.advancedWalletsEnabled !== "boolean") {
      repairedSettings.advancedWalletsEnabled = false;
    }
    if (typeof settings.smartInsightsEnabled !== "boolean") {
      repairedSettings.smartInsightsEnabled = false;
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
      initialBalanceMinor: 0,
      kind: "cash",
      creditLimitMinor: 0,
      excludeFromTotals: false,
      hideBalance: false,
      color: "#207a6f",
      icon: "wallet-cards",
      archivedAt: null
    });
  }

  const wallets = await db.wallets.toArray();
  await Promise.all(
    wallets
      .filter(
        (wallet) =>
          !wallet.currency ||
          !Number.isInteger(wallet.initialBalanceMinor) ||
          !wallet.kind ||
          !Number.isInteger(wallet.creditLimitMinor) ||
          typeof wallet.excludeFromTotals !== "boolean" ||
          typeof wallet.hideBalance !== "boolean" ||
          !wallet.color ||
          !wallet.icon ||
          (shouldMigrateDefaultCurrency &&
            wallet.name === "Everyday" &&
            (wallet.currency === previousAutoCurrency || wallet.currency !== DEFAULT_CURRENCY))
      )
      .map((wallet) =>
        db.wallets.put({
          ...wallet,
          currency:
            shouldMigrateDefaultCurrency &&
            wallet.name === "Everyday" &&
            (wallet.currency === previousAutoCurrency || wallet.currency !== DEFAULT_CURRENCY)
              ? DEFAULT_CURRENCY
              : wallet.currency || DEFAULT_CURRENCY,
          initialBalanceMinor: Number.isInteger(wallet.initialBalanceMinor)
            ? wallet.initialBalanceMinor
            : 0,
          kind: wallet.kind || "cash",
          creditLimitMinor: Number.isInteger(wallet.creditLimitMinor)
            ? wallet.creditLimitMinor
            : 0,
          excludeFromTotals:
            typeof wallet.excludeFromTotals === "boolean" ? wallet.excludeFromTotals : false,
          hideBalance: typeof wallet.hideBalance === "boolean" ? wallet.hideBalance : false,
          color: wallet.color || "#207a6f",
          icon: wallet.icon || "wallet-cards",
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
        ([name, color, icon], sortOrder): Category => ({
          ...createEntityBase(),
          name,
          color,
          icon,
          type: "expense",
          sortOrder
        })
      ),
      ...incomeCategories.map(
        ([name, color, icon], sortOrder): Category => ({
          ...createEntityBase(),
          name,
          color,
          icon,
          type: "income",
          sortOrder
        })
      )
    ]);
  }
}

export async function resetDatabaseForTests(db = financeDb): Promise<void> {
  await db.delete();
  await db.open();
}
