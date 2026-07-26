import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CategoryInput,
  MonthlyBudgetInput,
  RecurringTransactionInput,
  SavingsGoalContributionInput,
  SavingsGoalInput,
  SettingsUpdate,
  TransactionInput,
  WalletInput,
  WalletTransferInput
} from "@myfinances/types";
import { seedLocalData } from "../db/database";
import { backupRepository } from "../repositories/backupRepository";
import { budgetRepository } from "../repositories/budgetRepository";
import { categoryRepository } from "../repositories/categoryRepository";
import { recurringTransactionRepository } from "../repositories/recurringTransactionRepository";
import { savingsGoalRepository } from "../repositories/savingsGoalRepository";
import { settingsRepository } from "../repositories/settingsRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { walletRepository } from "../repositories/walletRepository";
import { walletTransferRepository } from "../repositories/walletTransferRepository";
import { queryKeys } from "../lib/queryKeys";

export function useFinanceData() {
  const bootstrap = useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: async () => {
      await seedLocalData();
      await recurringTransactionRepository.materializeDueTransactions();
      return true;
    }
  });
  const enabled = bootstrap.isSuccess;

  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsRepository.getSettings(),
    enabled
  });
  const wallets = useQuery({
    queryKey: queryKeys.wallets,
    queryFn: () => walletRepository.listWallets(),
    enabled
  });
  const archivedWallets = useQuery({
    queryKey: queryKeys.archivedWallets,
    queryFn: async () =>
      (await walletRepository.listWallets({ includeArchived: true })).filter(
        (wallet) => Boolean(wallet.archivedAt)
      ),
    enabled
  });
  const categories = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoryRepository.listCategories(),
    enabled
  });
  const transactions = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () => transactionRepository.listTransactions({ walletId: "all" }),
    enabled
  });
  const budgets = useQuery({
    queryKey: queryKeys.budgets,
    queryFn: () => budgetRepository.listBudgets(),
    enabled
  });
  const recurringTransactions = useQuery({
    queryKey: queryKeys.recurringTransactions,
    queryFn: () => recurringTransactionRepository.listRecurringTransactions(),
    enabled
  });
  const savingsGoals = useQuery({
    queryKey: queryKeys.savingsGoals,
    queryFn: () => savingsGoalRepository.listGoals(),
    enabled
  });
  const savingsGoalContributions = useQuery({
    queryKey: queryKeys.savingsGoalContributions,
    queryFn: () => savingsGoalRepository.listContributions(),
    enabled
  });
  const walletTransfers = useQuery({
    queryKey: queryKeys.walletTransfers,
    queryFn: () => walletTransferRepository.listTransfers(),
    enabled
  });

  return {
    bootstrap,
    settings,
    wallets,
    archivedWallets,
    categories,
    transactions,
    budgets,
    recurringTransactions,
    savingsGoals,
    savingsGoalContributions,
    walletTransfers
  };
}

function invalidateFinance(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
    queryClient.invalidateQueries({ queryKey: queryKeys.wallets }),
    queryClient.invalidateQueries({ queryKey: queryKeys.archivedWallets }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets }),
    queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoals }),
    queryClient.invalidateQueries({ queryKey: queryKeys.savingsGoalContributions }),
    queryClient.invalidateQueries({ queryKey: queryKeys.walletTransfers })
  ]);
}

export function useFinanceMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void invalidateFinance(queryClient);
  };

  return {
    addTransaction: useMutation({
      mutationFn: (input: TransactionInput) => transactionRepository.addTransaction(input),
      onSuccess: invalidate
    }),
    updateTransaction: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
        transactionRepository.updateTransaction(id, input),
      onSuccess: invalidate
    }),
    deleteTransaction: useMutation({
      mutationFn: (id: string) => transactionRepository.deleteTransaction(id),
      onSuccess: invalidate
    }),
    createWallet: useMutation({
      mutationFn: (input: WalletInput) => walletRepository.createWallet(input),
      onSuccess: invalidate
    }),
    updateWallet: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<WalletInput> }) =>
        walletRepository.updateWallet(id, input),
      onSuccess: invalidate
    }),
    archiveWallet: useMutation({
      mutationFn: (id: string) => walletRepository.archiveWallet(id),
      onSuccess: invalidate
    }),
    restoreWallet: useMutation({
      mutationFn: (id: string) => walletRepository.restoreWallet(id),
      onSuccess: invalidate
    }),
    createWalletTransfer: useMutation({
      mutationFn: (input: WalletTransferInput) =>
        walletTransferRepository.createTransfer(input),
      onSuccess: invalidate
    }),
    deleteWalletTransfer: useMutation({
      mutationFn: (id: string) => walletTransferRepository.deleteTransfer(id),
      onSuccess: invalidate
    }),
    createCategory: useMutation({
      mutationFn: (input: CategoryInput) => categoryRepository.createCategory(input),
      onSuccess: invalidate
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
        categoryRepository.updateCategory(id, input),
      onSuccess: invalidate
    }),
    deleteCategory: useMutation({
      mutationFn: (id: string) => categoryRepository.deleteCategory(id),
      onSuccess: invalidate
    }),
    setBudget: useMutation({
      mutationFn: (input: MonthlyBudgetInput) => budgetRepository.setBudget(input),
      onSuccess: invalidate
    }),
    createRecurringTransaction: useMutation({
      mutationFn: async (input: RecurringTransactionInput) => {
        const schedule = await recurringTransactionRepository.createRecurringTransaction(input);
        await recurringTransactionRepository.materializeDueTransactions();
        return schedule;
      },
      onSuccess: invalidate
    }),
    updateRecurringTransaction: useMutation({
      mutationFn: async ({ id, input }: { id: string; input: Partial<RecurringTransactionInput> }) => {
        const schedule = await recurringTransactionRepository.updateRecurringTransaction(id, input);
        await recurringTransactionRepository.materializeDueTransactions();
        return schedule;
      },
      onSuccess: invalidate
    }),
    setRecurringTransactionPaused: useMutation({
      mutationFn: async ({ id, paused }: { id: string; paused: boolean }) => {
        const schedule = await recurringTransactionRepository.setRecurringTransactionPaused(id, paused);
        if (!paused) {
          await recurringTransactionRepository.materializeDueTransactions();
        }
        return schedule;
      },
      onSuccess: invalidate
    }),
    deleteRecurringTransaction: useMutation({
      mutationFn: (id: string) => recurringTransactionRepository.deleteRecurringTransaction(id),
      onSuccess: invalidate
    }),
    createSavingsGoal: useMutation({
      mutationFn: (input: SavingsGoalInput) => savingsGoalRepository.createGoal(input),
      onSuccess: invalidate
    }),
    updateSavingsGoal: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<SavingsGoalInput> }) =>
        savingsGoalRepository.updateGoal(id, input),
      onSuccess: invalidate
    }),
    deleteSavingsGoal: useMutation({
      mutationFn: (id: string) => savingsGoalRepository.deleteGoal(id),
      onSuccess: invalidate
    }),
    addSavingsGoalContribution: useMutation({
      mutationFn: (input: SavingsGoalContributionInput) =>
        savingsGoalRepository.addContribution(input),
      onSuccess: invalidate
    }),
    deleteSavingsGoalContribution: useMutation({
      mutationFn: (id: string) => savingsGoalRepository.deleteContribution(id),
      onSuccess: invalidate
    }),
    updateSettings: useMutation({
      mutationFn: (update: SettingsUpdate) => settingsRepository.updateSettings(update),
      onSuccess: invalidate
    }),
    exportBackup: useMutation({
      mutationFn: () => backupRepository.exportBackup()
    }),
    importBackup: useMutation({
      mutationFn: (backup: unknown) => backupRepository.importBackup(backup),
      onSuccess: invalidate
    })
  };
}
