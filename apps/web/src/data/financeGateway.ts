import type { FinanceWireInputs, FinanceCommand, FinanceCommandResults, FinanceSnapshot, FinanceResource } from "@myfinances/api-contracts";
import { financeResources } from "@myfinances/api-contracts";
import type { TransactionAttachment } from "../db/models";
import type { TransactionSubmission } from "../lib/transactionAttachments";
export {
  commandResultSchemas, financeSnapshotSchema, financePatchSchema, financeResources,
  type FinanceSnapshot, type FinanceResource, type FinanceCommand, type FinanceCommandResults
} from "@myfinances/api-contracts";

export interface FinanceCommandInputs extends Omit<FinanceWireInputs,
  "addTransactionWithAttachments" | "updateTransactionWithAttachments" | "importBackup" |
  "exportBackup" | "createBackupSnapshot"
> {
  addTransactionWithAttachments: TransactionSubmission;
  updateTransactionWithAttachments: { id: string; submission: TransactionSubmission };
  importBackup: unknown;
  exportBackup: void;
  createBackupSnapshot: void;
}
export type FinanceCommandHandlers = {
  [K in FinanceCommand]: (input: FinanceCommandInputs[K]) => Promise<FinanceCommandResults[K]>;
};
export interface RequestOptions { signal?: AbortSignal; requestId?: string }

export interface FinanceGateway {
  readonly mode: "local" | "remote";
  initialize(options?: RequestOptions): Promise<void>;
  read(resources: readonly FinanceResource[], options?: RequestOptions): Promise<Partial<FinanceSnapshot>>;
  execute<K extends FinanceCommand>(command: K, input: FinanceCommandInputs[K], options?: RequestOptions): Promise<FinanceCommandResults[K]>;
  listAttachments(transactionId: string, options?: RequestOptions): Promise<TransactionAttachment[]>;
}

export const commandResources: Record<FinanceCommand, readonly FinanceResource[]> = {
  addTransaction: ["transactions"],
  addTransactionWithAttachments: ["transactions"],
  updateTransaction: ["transactions"],
  updateTransactionWithAttachments: ["transactions"],
  deleteTransaction: ["transactions"],
  createTransactionTemplate: ["transactionTemplates"],
  deleteTransactionTemplate: ["transactionTemplates"],
  createWallet: ["wallets"],
  updateWallet: financeResources,
  archiveWallet: ["wallets", "recurringTransactions", "settings"],
  restoreWallet: ["wallets"],
  reorderWallets: ["wallets"],
  createWalletTransfer: ["walletTransfers"],
  deleteWalletTransfer: ["walletTransfers"],
  createCategory: ["categories"],
  updateCategory: ["categories", "recurringTransactions", "transactionTemplates"],
  deleteCategory: ["categories", "recurringTransactions", "transactionTemplates"],
  reorderCategories: ["categories"],
  replaceCategory: ["categories", "transactions", "recurringTransactions", "budgets", "transactionTemplates"],
  setBudget: ["budgets"],
  createRecurringTransaction: ["recurringTransactions", "transactions"],
  updateRecurringTransaction: ["recurringTransactions", "transactions"],
  setRecurringTransactionPaused: ["recurringTransactions", "transactions"],
  deleteRecurringTransaction: ["recurringTransactions"],
  createSavingsGoal: ["savingsGoals"],
  updateSavingsGoal: ["savingsGoals"],
  deleteSavingsGoal: ["savingsGoals", "savingsGoalContributions"],
  addSavingsGoalContribution: ["savingsGoals", "savingsGoalContributions"],
  deleteSavingsGoalContribution: ["savingsGoals", "savingsGoalContributions"],
  updateSettings: ["settings"],
  exportBackup: [],
  importBackup: financeResources,
  createBackupSnapshot: ["backupSnapshots"],
  restoreBackupSnapshot: financeResources,
  deleteBackupSnapshot: ["backupSnapshots"]
};
