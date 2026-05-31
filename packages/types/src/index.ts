import { z } from "zod";

export const syncStatusSchema = z.enum(["local", "synced", "pending", "conflict"]);
export type SyncStatus = z.infer<typeof syncStatusSchema>;

export const transactionTypeSchema = z.enum(["expense", "income"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export type ThemePreference = z.infer<typeof themePreferenceSchema>;

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

export const transactionSchema = baseEntitySchema.extend({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  transactionDate: z.string().datetime()
});
export type Transaction = z.infer<typeof transactionSchema>;

export const transactionInputSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  type: transactionTypeSchema,
  note: z.string().max(240).optional(),
  transactionDate: z.string().datetime()
});
export type TransactionInput = z.infer<typeof transactionInputSchema>;

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
  activeWalletId: walletViewSchema,
  defaultsVersion: z.number().int().default(2),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Settings = z.infer<typeof settingsSchema>;

export const settingsUpdateSchema = settingsSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  wallets: z.array(walletSchema),
  categories: z.array(categorySchema),
  transactions: z.array(transactionSchema),
  settings: settingsSchema
});
export type FinanceBackup = z.infer<typeof backupSchema>;
