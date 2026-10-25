import { z } from "zod";
import {
  backupSchema, backupSnapshotSchema, categoryInputSchema, categorySchema,
  monthlyBudgetInputSchema, monthlyBudgetSchema, recurringTransactionInputSchema,
  recurringTransactionSchema, savingsGoalContributionInputSchema, savingsGoalContributionSchema,
  savingsGoalInputSchema, savingsGoalSchema, settingsSchema, settingsUpdateSchema,
  transactionInputSchema, transactionSchema, transactionTemplateInputSchema,
  transactionTemplateSchema, walletInputSchema, walletSchema,
  walletTransferInputSchema, walletTransferSchema
} from "@myfinances/types";

export const FINANCE_API_VERSION = "v1";
export const financeSnapshotSchema = z.object({
  settings: settingsSchema,
  wallets: z.array(walletSchema),
  categories: z.array(categorySchema),
  transactions: z.array(transactionSchema),
  transactionTemplates: z.array(transactionTemplateSchema),
  budgets: z.array(monthlyBudgetSchema),
  recurringTransactions: z.array(recurringTransactionSchema),
  savingsGoals: z.array(savingsGoalSchema),
  savingsGoalContributions: z.array(savingsGoalContributionSchema),
  walletTransfers: z.array(walletTransferSchema),
  backupSnapshots: z.array(backupSnapshotSchema)
});
export const financePatchSchema = financeSnapshotSchema.partial();
export type FinanceSnapshot = z.infer<typeof financeSnapshotSchema>;
export type FinanceResource = keyof FinanceSnapshot;
export const financeResources = Object.keys(financeSnapshotSchema.shape) as FinanceResource[];

const id = z.string().uuid();
const submissionSchema = z.object({ input: transactionInputSchema, removedAttachmentIds: z.array(id).default([]) });

// Browser Files travel in multipart fields, separately from these JSON inputs.
export const commandInputSchemas = {
  addTransaction: transactionInputSchema,
  addTransactionWithAttachments: submissionSchema,
  updateTransaction: z.object({ id, input: transactionInputSchema.partial() }),
  updateTransactionWithAttachments: z.object({ id, submission: submissionSchema }),
  deleteTransaction: id,
  createTransactionTemplate: transactionTemplateInputSchema,
  deleteTransactionTemplate: id,
  createWallet: walletInputSchema,
  updateWallet: z.object({ id, input: walletInputSchema.partial() }),
  archiveWallet: id,
  restoreWallet: id,
  reorderWallets: z.array(id),
  createWalletTransfer: walletTransferInputSchema,
  deleteWalletTransfer: id,
  createCategory: categoryInputSchema,
  updateCategory: z.object({ id, input: categoryInputSchema.partial() }),
  deleteCategory: id,
  reorderCategories: z.object({ type: z.enum(["expense", "income"]), orderedIds: z.array(id) }),
  replaceCategory: z.object({ sourceId: id, targetId: id, deleteSource: z.boolean() }),
  setBudget: monthlyBudgetInputSchema,
  createRecurringTransaction: recurringTransactionInputSchema,
  updateRecurringTransaction: z.object({ id, input: recurringTransactionInputSchema.partial() }),
  setRecurringTransactionPaused: z.object({ id, paused: z.boolean() }),
  deleteRecurringTransaction: id,
  createSavingsGoal: savingsGoalInputSchema,
  updateSavingsGoal: z.object({ id, input: savingsGoalInputSchema.partial() }),
  deleteSavingsGoal: id,
  addSavingsGoalContribution: savingsGoalContributionInputSchema,
  deleteSavingsGoalContribution: id,
  updateSettings: settingsUpdateSchema,
  exportBackup: z.null(),
  importBackup: backupSchema,
  createBackupSnapshot: z.null(),
  restoreBackupSnapshot: id,
  deleteBackupSnapshot: id
};
export type FinanceCommand = keyof typeof commandInputSchemas;
export type FinanceWireInputs = { [K in FinanceCommand]: z.input<(typeof commandInputSchemas)[K]> };

// Void command responses use null on the wire and void in application code.
const voidResult = z.null().transform((): void => undefined);
export const commandResultSchemas = {
  addTransaction: transactionSchema,
  addTransactionWithAttachments: transactionSchema,
  updateTransaction: transactionSchema,
  updateTransactionWithAttachments: transactionSchema,
  deleteTransaction: voidResult,
  createTransactionTemplate: transactionTemplateSchema,
  deleteTransactionTemplate: voidResult,
  createWallet: walletSchema,
  updateWallet: walletSchema,
  archiveWallet: voidResult,
  restoreWallet: walletSchema,
  reorderWallets: voidResult,
  createWalletTransfer: walletTransferSchema,
  deleteWalletTransfer: voidResult,
  createCategory: categorySchema,
  updateCategory: categorySchema,
  deleteCategory: voidResult,
  reorderCategories: voidResult,
  replaceCategory: voidResult,
  setBudget: monthlyBudgetSchema.nullable(),
  createRecurringTransaction: recurringTransactionSchema,
  updateRecurringTransaction: recurringTransactionSchema,
  setRecurringTransactionPaused: recurringTransactionSchema,
  deleteRecurringTransaction: voidResult,
  createSavingsGoal: savingsGoalSchema,
  updateSavingsGoal: savingsGoalSchema,
  deleteSavingsGoal: voidResult,
  addSavingsGoalContribution: savingsGoalContributionSchema,
  deleteSavingsGoalContribution: voidResult,
  updateSettings: settingsSchema,
  exportBackup: backupSchema,
  importBackup: backupSchema,
  createBackupSnapshot: backupSnapshotSchema,
  restoreBackupSnapshot: backupSchema,
  deleteBackupSnapshot: voidResult
} satisfies Record<FinanceCommand, z.ZodTypeAny>;
export type FinanceCommandResults = { [K in FinanceCommand]: z.output<(typeof commandResultSchemas)[K]> };

export const attachmentMetadataSchema = z.object({
  id, transactionId: id, name: z.string(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  size: z.number().int().nonnegative().max(10 * 1024 * 1024),
  createdAt: z.string().datetime()
});
export type AttachmentMetadata = z.infer<typeof attachmentMetadataSchema>;

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() })
});
