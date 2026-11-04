export const queryKeys = {
  bootstrap: ["bootstrap"] as const,
  settings: ["settings"] as const,
  wallets: ["wallets"] as const,
  archivedWallets: ["archived-wallets"] as const,
  categories: ["categories"] as const,
  backupSnapshots: ["backup-snapshots"] as const,
  transactions: ["transactions"] as const,
  deletedTransactions: ["transactions", "deleted"] as const,
  transactionTemplates: ["transaction-templates"] as const,
  budgets: ["budgets"] as const,
  recurringTransactions: ["recurring-transactions"] as const,
  savingsGoals: ["savings-goals"] as const,
  savingsGoalContributions: ["savings-goal-contributions"] as const,
  walletTransfers: ["wallet-transfers"] as const
};
