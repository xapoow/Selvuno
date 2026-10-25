import { seedLocalData, financeDb } from "../db/database";
import { backupRepository } from "../repositories/backupRepository";
import { budgetRepository } from "../repositories/budgetRepository";
import { categoryRepository } from "../repositories/categoryRepository";
import { recurringTransactionRepository } from "../repositories/recurringTransactionRepository";
import { savingsGoalRepository } from "../repositories/savingsGoalRepository";
import { settingsRepository } from "../repositories/settingsRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { transactionAttachmentRepository } from "../repositories/transactionAttachmentRepository";
import { transactionTemplateRepository } from "../repositories/transactionTemplateRepository";
import { walletRepository } from "../repositories/walletRepository";
import { walletTransferRepository } from "../repositories/walletTransferRepository";
import {
  financePatchSchema, type FinanceCommandHandlers, type FinanceGateway, type FinanceSnapshot
} from "./financeGateway";

const readers: { [K in keyof FinanceSnapshot]: () => Promise<FinanceSnapshot[K]> } = {
  settings: async () => {
    const settings = await financeDb.settings.get("default");
    if (!settings) throw new Error("Settings not found.");
    return settings;
  },
  wallets: () => walletRepository.listWallets({ includeArchived: true }),
  categories: () => categoryRepository.listCategories(),
  transactions: () => transactionRepository.listTransactions({ walletId: "all" }),
  transactionTemplates: () => transactionTemplateRepository.listTemplates(),
  budgets: () => budgetRepository.listBudgets(),
  recurringTransactions: () => recurringTransactionRepository.listRecurringTransactions(),
  savingsGoals: () => savingsGoalRepository.listGoals(),
  savingsGoalContributions: () => savingsGoalRepository.listContributions(),
  walletTransfers: () => walletTransferRepository.listTransfers(),
  backupSnapshots: () => backupRepository.listSnapshots()
};

const commands: FinanceCommandHandlers = {
  addTransaction: (input) => transactionRepository.addTransaction(input),
  addTransactionWithAttachments: async ({ input, newFiles }) =>
    financeDb.transaction("rw", [financeDb.wallets, financeDb.transactions, financeDb.transactionAttachments], async () => {
      const transaction = await transactionRepository.addTransaction(input);
      await transactionAttachmentRepository.applyChanges(transaction.id, newFiles, []);
      return (await financeDb.transactions.get(transaction.id))!;
    }),
  updateTransaction: ({ id, input }) => transactionRepository.updateTransaction(id, input),
  updateTransactionWithAttachments: async ({ id, submission }) =>
    financeDb.transaction("rw", [financeDb.wallets, financeDb.transactions, financeDb.transactionAttachments], async () => {
      await transactionRepository.updateTransaction(id, submission.input);
      await transactionAttachmentRepository.applyChanges(id, submission.newFiles, submission.removedAttachmentIds);
      return (await financeDb.transactions.get(id))!;
    }),
  deleteTransaction: (id) => transactionRepository.deleteTransaction(id),
  createTransactionTemplate: (input) => transactionTemplateRepository.createTemplate(input),
  deleteTransactionTemplate: (id) => transactionTemplateRepository.deleteTemplate(id),
  createWallet: (input) => walletRepository.createWallet(input),
  updateWallet: ({ id, input }) => walletRepository.updateWallet(id, input),
  archiveWallet: (id) => walletRepository.archiveWallet(id),
  restoreWallet: (id) => walletRepository.restoreWallet(id),
  reorderWallets: (ids) => walletRepository.reorderWallets(ids),
  createWalletTransfer: (input) => walletTransferRepository.createTransfer(input),
  deleteWalletTransfer: (id) => walletTransferRepository.deleteTransfer(id),
  createCategory: (input) => categoryRepository.createCategory(input),
  updateCategory: ({ id, input }) => categoryRepository.updateCategory(id, input),
  deleteCategory: (id) => categoryRepository.deleteCategory(id),
  reorderCategories: ({ type, orderedIds }) => categoryRepository.reorderCategories(type, orderedIds),
  replaceCategory: ({ sourceId, targetId, deleteSource }) => categoryRepository.replaceCategory(sourceId, targetId, deleteSource),
  setBudget: (input) => budgetRepository.setBudget(input),
  createRecurringTransaction: async (input) => {
    const result = await recurringTransactionRepository.createRecurringTransaction(input);
    await recurringTransactionRepository.materializeDueTransactions();
    return result;
  },
  updateRecurringTransaction: async ({ id, input }) => {
    const result = await recurringTransactionRepository.updateRecurringTransaction(id, input);
    await recurringTransactionRepository.materializeDueTransactions();
    return result;
  },
  setRecurringTransactionPaused: async ({ id, paused }) => {
    const result = await recurringTransactionRepository.setRecurringTransactionPaused(id, paused);
    if (!paused) await recurringTransactionRepository.materializeDueTransactions();
    return result;
  },
  deleteRecurringTransaction: (id) => recurringTransactionRepository.deleteRecurringTransaction(id),
  createSavingsGoal: (input) => savingsGoalRepository.createGoal(input),
  updateSavingsGoal: ({ id, input }) => savingsGoalRepository.updateGoal(id, input),
  deleteSavingsGoal: (id) => savingsGoalRepository.deleteGoal(id),
  addSavingsGoalContribution: (input) => savingsGoalRepository.addContribution(input),
  deleteSavingsGoalContribution: (id) => savingsGoalRepository.deleteContribution(id),
  updateSettings: (input) => settingsRepository.updateSettings(input),
  exportBackup: () => backupRepository.exportBackup(),
  importBackup: (input) => backupRepository.importBackup(input),
  createBackupSnapshot: () => backupRepository.createSnapshot("automatic"),
  restoreBackupSnapshot: (id) => backupRepository.restoreSnapshot(id),
  deleteBackupSnapshot: (id) => backupRepository.deleteSnapshot(id)
};

export function createLocalFinanceGateway(): FinanceGateway {
  return {
    mode: "local",
    async initialize() {
      await seedLocalData();
      await recurringTransactionRepository.materializeDueTransactions();
    },
    async read(resources) {
      return financeDb.transaction("r", financeDb.tables, async () => {
        const entries = await Promise.all(resources.map(async (key) => [key, await readers[key]()]));
        return financePatchSchema.parse(Object.fromEntries(entries));
      });
    },
    execute(command, input) {
      return commands[command](input);
    },
    listAttachments(transactionId) {
      return transactionAttachmentRepository.listByTransaction(transactionId);
    }
  };
}
