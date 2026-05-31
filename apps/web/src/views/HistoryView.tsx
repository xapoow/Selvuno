import { useMemo, useState } from "react";
import type {
  Category,
  Settings,
  Transaction,
  TransactionInput,
  TransactionType,
  Wallet,
  WalletView
} from "@myfinances/types";
import { ReceiptText } from "lucide-react";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionRow } from "../components/TransactionRow";
import { BottomSheet } from "../components/ui/BottomSheet";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { SelectField } from "../components/ui/SelectField";

interface HistoryViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  onUpdate: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type TypeFilter = TransactionType | "all";

export function HistoryView({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  onUpdate,
  onDelete
}: HistoryViewProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const visibleTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (transaction.deletedAt) {
          return false;
        }
        if (activeWalletId !== "all" && transaction.walletId !== activeWalletId) {
          return false;
        }
        if (typeFilter !== "all" && transaction.type !== typeFilter) {
          return false;
        }
        if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter) {
          return false;
        }
        return true;
      }),
    [activeWalletId, categoryFilter, transactions, typeFilter]
  );

  async function handleDelete(transaction: Transaction) {
    if (window.confirm("Delete this transaction?")) {
      await onDelete(transaction.id);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">History</h2>
      </div>
      <div className="grid gap-3 rounded-app border border-line bg-surface p-3">
        <SegmentedControl
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: "all", label: "All" },
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" }
          ]}
        />
        <SelectField label="Category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
      </div>
      {visibleTransactions.length ? (
        <div className="grid gap-2">
          {visibleTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              category={categories.find((category) => category.id === transaction.categoryId)}
              wallet={wallets.find((wallet) => wallet.id === transaction.walletId)}
              settings={settings}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon={ReceiptText} title="No transactions match these filters." />
      )}

      <BottomSheet open={Boolean(editing)} title="Edit transaction" onClose={() => setEditing(null)}>
        {editing ? (
          <TransactionForm
            wallets={wallets}
            categories={categories}
            settings={settings}
            activeWalletId={activeWalletId}
            initial={editing}
            submitLabel="Update transaction"
            onSubmit={async (input) => {
              await onUpdate(editing.id, input);
              setEditing(null);
            }}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}
