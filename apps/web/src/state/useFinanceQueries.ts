import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CategoryInput,
  SettingsUpdate,
  TransactionInput,
  WalletInput
} from "@myfinances/types";
import { seedLocalData } from "../db/database";
import { backupRepository } from "../repositories/backupRepository";
import { categoryRepository } from "../repositories/categoryRepository";
import { settingsRepository } from "../repositories/settingsRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { walletRepository } from "../repositories/walletRepository";
import { queryKeys } from "../lib/queryKeys";

export function useFinanceData() {
  const bootstrap = useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: async () => {
      await seedLocalData();
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

  return { bootstrap, settings, wallets, categories, transactions };
}

function invalidateFinance(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
    queryClient.invalidateQueries({ queryKey: queryKeys.wallets }),
    queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
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
