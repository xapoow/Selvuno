import { z } from "zod";

export const syncStatusSchema = z.enum(["local", "synced", "pending", "conflict"]);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export const transactionTypeSchema = z.enum(["expense", "income"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;
export const transactionTagSchema = z.string().trim().min(1).max(32);
export const calendarDateSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
export type CalendarDate = z.infer<typeof calendarDateSchema>;

export const recurrenceFrequencySchema = z.enum(["daily", "weekly", "monthly", "yearly"]);
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export const colorThemePreferenceSchema = z.enum([
  "sage",
  "rose",
  "violet",
  "sky",
  "amber",
  "graphite",
  "mint",
  "coral"
]);
export type ColorThemePreference = z.infer<typeof colorThemePreferenceSchema>;

export const walletViewSchema = z.union([z.literal("all"), z.string().uuid()]);
export type WalletView = z.infer<typeof walletViewSchema>;

export const walletKindSchema = z.enum(["cash", "credit"]);
export type WalletKind = z.infer<typeof walletKindSchema>;

export const dateFormatPreferenceSchema = z.enum(["short", "medium", "long"]);
export type DateFormatPreference = z.infer<typeof dateFormatPreferenceSchema>;

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
  syncStatus: syncStatusSchema
});

export const balanceReconciliationSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  currency: z.string().length(3),
  expectedBalanceMinor: z.number().int().safe(),
  actualBalanceMinor: z.number().int().safe(),
  adjustmentMinor: z.number().int().safe(),
  note: z.string().max(240).optional()
}).refine((item) => item.actualBalanceMinor - item.expectedBalanceMinor === item.adjustmentMinor, {
  message: "Balance adjustment does not match the recorded difference."
});
export type BalanceReconciliation = z.infer<typeof balanceReconciliationSchema>;

export const walletReconciliationInputSchema = z.object({
  walletId: z.string().uuid(),
  currency: z.string().length(3),
  expectedBalanceMinor: z.number().int().safe(),
  actualBalanceMinor: z.number().int().safe(),
  note: z.string().max(240).optional()
});
export type WalletReconciliationInput = z.infer<typeof walletReconciliationInputSchema>;

export const walletSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(64),
  currency: z.string().length(3),
  initialBalanceMinor: z.number().int().default(0),
  kind: walletKindSchema.default("cash"),
  creditLimitMinor: z.number().int().nonnegative().default(0),
  excludeFromTotals: z.boolean().default(false),
  hideBalance: z.boolean().default(false),
  color: z.string().min(4).max(32).default("#207a6f"),
  icon: z.string().min(1).max(32).default("wallet-cards"),
  archivedAt: z.string().datetime().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
  balanceReconciliations: z.array(balanceReconciliationSchema).optional()
}).refine((wallet) => (wallet.balanceReconciliations ?? []).every((item) => item.currency === wallet.currency), {
  message: "Reconciliation currency must match the wallet."
});
export type Wallet = z.infer<typeof walletSchema>;

export const walletInputSchema = z.object({
  name: z.string().min(1).max(64),
  currency: z.string().length(3),
  initialBalanceMinor: z.number().int().optional(),
  kind: walletKindSchema.optional(),
  creditLimitMinor: z.number().int().nonnegative().optional(),
  excludeFromTotals: z.boolean().optional(),
  hideBalance: z.boolean().optional(),
  color: z.string().min(4).max(32).optional(),
  icon: z.string().min(1).max(32).optional(),
  sortOrder: z.number().int().nonnegative().optional()
});
export type WalletInput = z.infer<typeof walletInputSchema>;

export const walletTransferSchema = baseEntitySchema.extend({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid(),
  fromAmountMinor: z.number().int().positive(),
  toAmountMinor: z.number().int().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  transferDate: z.string().datetime(),
  note: z.string().max(160).optional()
});
export type WalletTransfer = z.infer<typeof walletTransferSchema>;

export const walletTransferInputSchema = z
  .object({
    fromWalletId: z.string().uuid(),
    toWalletId: z.string().uuid(),
    fromAmountMinor: z.number().int().positive(),
    toAmountMinor: z.number().int().positive(),
    transferDate: z.string().datetime(),
    note: z.string().max(160).optional()
  })
  .refine((input) => input.fromWalletId !== input.toWalletId, {
    message: "Choose two different wallets.",
    path: ["toWalletId"]
  });
export type WalletTransferInput = z.infer<typeof walletTransferInputSchema>;

export const categorySchema = baseEntitySchema.extend({
  name: z.string().min(1).max(48),
  color: z.string().min(4).max(32),
  icon: z.string().min(1).max(32),
  type: transactionTypeSchema,
  sortOrder: z.number().int().nonnegative().default(0)
});
export type Category = z.infer<typeof categorySchema>;

export const categoryInputSchema = z.object({
  name: z.string().min(1).max(48),
  color: z.string().min(4).max(32),
  icon: z.string().min(1).max(32),
  type: transactionTypeSchema
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const budgetMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export type BudgetMonth = z.infer<typeof budgetMonthSchema>;

export const monthlyBudgetSchema = baseEntitySchema.extend({
  categoryId: z.string().uuid(),
  month: budgetMonthSchema,
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3)
});
export type MonthlyBudget = z.infer<typeof monthlyBudgetSchema>;

export const monthlyBudgetInputSchema = z.object({
  categoryId: z.string().uuid(),
  month: budgetMonthSchema,
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3)
});
export type MonthlyBudgetInput = z.infer<typeof monthlyBudgetInputSchema>;

export const transactionSchema = baseEntitySchema.extend({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  tags: z.array(transactionTagSchema).max(12).default([]),
  attachmentCount: z.number().int().nonnegative().optional(),
  transactionDate: z.string().datetime(),
  recurringTransactionId: z.string().uuid().optional(),
  recurrenceDate: calendarDateSchema.optional()
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionInputSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  tags: z.array(transactionTagSchema).max(12).optional(),
  transactionDate: z.string().datetime()
});
export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionTemplateSchema = baseEntitySchema.extend({
  name: z.string().trim().min(1).max(48),
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive().optional(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  tags: z.array(transactionTagSchema).max(12).default([]),
  sortOrder: z.number().int().nonnegative().default(0)
});
export type TransactionTemplate = z.infer<typeof transactionTemplateSchema>;

export const transactionTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(48),
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive().optional(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  tags: z.array(transactionTagSchema).max(12).optional()
});
export type TransactionTemplateInput = z.infer<typeof transactionTemplateInputSchema>;

export const recurringTransactionSchema = baseEntitySchema.extend({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  tags: z.array(transactionTagSchema).max(12).default([]),
  frequency: recurrenceFrequencySchema,
  startDate: calendarDateSchema,
  nextRunDate: calendarDateSchema,
  paused: z.boolean()
});
export type RecurringTransaction = z.infer<typeof recurringTransactionSchema>;

export const recurringTransactionInputSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  tags: z.array(transactionTagSchema).max(12).optional(),
  frequency: recurrenceFrequencySchema,
  startDate: calendarDateSchema
});
export type RecurringTransactionInput = z.infer<typeof recurringTransactionInputSchema>;

export const savingsGoalSchema = baseEntitySchema.extend({
  walletId: z.string().uuid(),
  name: z.string().trim().min(1).max(64),
  targetAmountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  targetDate: calendarDateSchema.optional(),
  color: z.string().min(4).max(32)
});
export type SavingsGoal = z.infer<typeof savingsGoalSchema>;

export const savingsGoalInputSchema = z.object({
  walletId: z.string().uuid(),
  name: z.string().trim().min(1).max(64),
  targetAmountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  targetDate: calendarDateSchema.optional(),
  color: z.string().min(4).max(32)
});
export type SavingsGoalInput = z.infer<typeof savingsGoalInputSchema>;

export const savingsGoalContributionSchema = baseEntitySchema.extend({
  goalId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  contributionDate: z.string().datetime(),
  note: z.string().max(160).optional()
});
export type SavingsGoalContribution = z.infer<typeof savingsGoalContributionSchema>;

export const savingsGoalContributionInputSchema = z.object({
  goalId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  contributionDate: z.string().datetime(),
  note: z.string().max(160).optional()
});
export type SavingsGoalContributionInput = z.infer<typeof savingsGoalContributionInputSchema>;

export const transactionFilterSchema = z.object({
  walletId: walletViewSchema.default("all"),
  type: z.union([transactionTypeSchema, z.literal("all")]).default("all"),
  categoryId: z.union([z.string().uuid(), z.literal("all")]).default("all"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  includeDeleted: z.boolean().default(false)
});
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

export const dashboardBlockSchema = z.enum(["summary", "budget", "insights", "cashFlow", "recent", "goals"]);
export type DashboardBlockId = z.infer<typeof dashboardBlockSchema>;
export const dashboardLayoutSchema = z.object({
  order: z.array(dashboardBlockSchema).max(6).refine((items) => new Set(items).size === items.length),
  hidden: z.array(dashboardBlockSchema).max(6).refine((items) => new Set(items).size === items.length)
});
export type DashboardLayout = z.infer<typeof dashboardLayoutSchema>;

export const settingsSchema = z.object({
  id: z.literal("default"),
  locale: z.string().min(2),
  currency: z.string().length(3),
  dateFormat: dateFormatPreferenceSchema,
  timeZone: z.string().min(1).default("UTC"),
  theme: themePreferenceSchema,
  colorTheme: colorThemePreferenceSchema.default("sage"),
  activeWalletId: walletViewSchema,
  hideAmounts: z.boolean().default(false),
  quickTemplatesEnabled: z.boolean().default(true),
  categorySuggestionsEnabled: z.boolean().default(false),
  addAnotherEnabled: z.boolean().default(true),
  advancedWalletsEnabled: z.boolean().default(false),
  smartInsightsEnabled: z.boolean().default(false),
  hapticsEnabled: z.boolean().default(false),
  dashboardLayout: dashboardLayoutSchema.optional(),
  onboardingCompleted: z.boolean().default(false),
  defaultsVersion: z.number().int().default(2),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Settings = z.infer<typeof settingsSchema>;

export const settingsUpdateSchema = settingsSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;

const backupV1Schema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  wallets: z.array(walletSchema),
  categories: z.array(categorySchema),
  transactions: z.array(transactionSchema),
  settings: settingsSchema
});

const backupV2Schema = backupV1Schema.extend({
  version: z.literal(2),
  budgets: z.array(monthlyBudgetSchema)
});

const backupV3Schema = backupV2Schema.extend({
  version: z.literal(3),
  recurringTransactions: z.array(recurringTransactionSchema)
});

const backupV4Schema = backupV3Schema.extend({
  version: z.literal(4),
  savingsGoals: z.array(savingsGoalSchema),
  savingsGoalContributions: z.array(savingsGoalContributionSchema)
});

const backupV5Schema = backupV4Schema.extend({
  version: z.literal(5),
  walletTransfers: z.array(walletTransferSchema)
});

const backupV6Schema = backupV5Schema.extend({
  version: z.literal(6)
});

const backupV7Schema = backupV6Schema.extend({
  version: z.literal(7),
  transactionTemplates: z.array(transactionTemplateSchema)
});

const backupV8Schema = backupV7Schema.extend({
  version: z.literal(8)
});

export const backupSchema = z.discriminatedUnion("version", [
  backupV1Schema,
  backupV2Schema,
  backupV3Schema,
  backupV4Schema,
  backupV5Schema,
  backupV6Schema,
  backupV7Schema,
  backupV8Schema
]);
export type FinanceBackup = z.infer<typeof backupSchema>;
export type FinanceBackupV2 = z.infer<typeof backupV2Schema>;
export type FinanceBackupV3 = z.infer<typeof backupV3Schema>;
export type FinanceBackupV4 = z.infer<typeof backupV4Schema>;
export type FinanceBackupV5 = z.infer<typeof backupV5Schema>;
export type FinanceBackupV6 = z.infer<typeof backupV6Schema>;
export type FinanceBackupV7 = z.infer<typeof backupV7Schema>;
export type FinanceBackupV8 = z.infer<typeof backupV8Schema>;

export const backupSnapshotReasonSchema = z.enum(["automatic", "before-restore"]);
export type BackupSnapshotReason = z.infer<typeof backupSnapshotReasonSchema>;

export const backupSnapshotSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  reason: backupSnapshotReasonSchema,
  backup: backupSchema
});
export type BackupSnapshot = z.infer<typeof backupSnapshotSchema>;
