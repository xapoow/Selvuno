import { categorySchema, settingsSchema, transactionSchema, walletSchema } from "@myfinances/types";

const entity = {
  userId: null,
  createdAt: "2026-11-04T10:00:00.000Z",
  updatedAt: "2026-11-04T10:00:00.000Z",
  deletedAt: null,
  syncStatus: "local"
};

export const testWallet = walletSchema.parse({
  ...entity, id: "10000000-0000-4000-8000-000000000001", name: "Everyday", currency: "USD", archivedAt: null
});
export const testCategory = categorySchema.parse({
  ...entity, id: "20000000-0000-4000-8000-000000000001", name: "Groceries", type: "expense", color: "#207a6f", icon: "shopping-basket"
});
export const testTransaction = transactionSchema.parse({
  ...entity, id: "30000000-0000-4000-8000-000000000001", walletId: testWallet.id, categoryId: testCategory.id,
  type: "expense", amountMinor: 1250, currency: "USD", note: "Receipt for groceries", transactionDate: "2026-11-04T10:00:00.000Z"
});
export const testSettings = settingsSchema.parse({
  id: "default", locale: "en-US", currency: "USD", dateFormat: "medium", timeZone: "UTC",
  theme: "dark", colorTheme: "sage", activeWalletId: "all", onboardingCompleted: true,
  createdAt: entity.createdAt, updatedAt: entity.updatedAt
});
