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

export const walletSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(64),
  currency: z.string().length(3),
  archivedAt: z.string().datetime().nullable()
});
export type Wallet = z.infer<typeof walletSchema>;

export const walletInputSchema = z.object({
  name: z.string().min(1).max(64),
  currency: z.string().length(3)
});
export type WalletInput = z.infer<typeof walletInputSchema>;

export const categorySchema = baseEntitySchema.extend({
  name: z.string().min(1).max(48),
  color: z.string().min(4).max(32),
  icon: z.string().min(1).max(32),
  type: transactionTypeSchema
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

export const settingsSchema = z.object({
  id: z.literal("default"),
  locale: z.string().min(2),
  currency: z.string().length(3),
  dateFormat: dateFormatPreferenceSchema,
  timeZone: z.string().min(1).default("UTC"),
  theme: themePreferenceSchema,
  colorTheme: colorThemePreferenceSchema.default("sage"),
  activeWalletId: walletViewSchema,
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

export const backupSchema = z.discriminatedUnion("version", [
  backupV1Schema,
  backupV2Schema,
  backupV3Schema,
  backupV4Schema
]);
export type FinanceBackup = z.infer<typeof backupSchema>;
export type FinanceBackupV2 = z.infer<typeof backupV2Schema>;
export type FinanceBackupV3 = z.infer<typeof backupV3Schema>;
export type FinanceBackupV4 = z.infer<typeof backupV4Schema>;
