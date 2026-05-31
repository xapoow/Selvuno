import type { Category, Settings, Transaction, Wallet, WalletView } from "@myfinances/types";
import { BarChart3, PlusCircle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { calculateTransactionTotals, filterTransactionsByWallet, formatMoney } from "@myfinances/utils";
import { TransactionRow } from "../components/TransactionRow";
import { EmptyState } from "../components/ui/EmptyState";
import { Section } from "../components/ui/Section";
import { StatPanel } from "../components/ui/StatPanel";

interface DashboardViewProps {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  onAdd: () => void;
}

export function DashboardView({
  wallets,
  categories,
  transactions,
  settings,
  activeWalletId,
  onAdd
}: DashboardViewProps) {
  const selectedWallet = wallets.find((wallet) => wallet.id === activeWalletId);
  const currency = selectedWallet?.currency ?? settings.currency;
  const visibleTransactions = filterTransactionsByWallet(transactions, activeWalletId).filter(
    (transaction) => !transaction.deletedAt
  );
  const totals = calculateTransactionTotals(transactions, activeWalletId);
  const recentTransactions = visibleTransactions.slice(0, 4);
  const categoryTotals = categories
    .filter((category) => category.type === "expense")
    .map((category) => ({
      name: category.name,
      color: category.color,
      value: visibleTransactions
        .filter((transaction) => transaction.type === "expense" && transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + transaction.amountMinor, 0)
    }))
    .filter((item) => item.value > 0)
    .slice(0, 6);

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatPanel label="Balance" value={formatMoney(totals.balanceMinor, currency, settings.locale)} />
          <StatPanel
            label="Income"
            value={formatMoney(totals.incomeMinor, currency, settings.locale)}
            tone="income"
          />
          <StatPanel
            label="Expenses"
            value={formatMoney(totals.expenseMinor, currency, settings.locale)}
            tone="expense"
          />
        </div>
      </section>

      <Section title="Spending">
        {categoryTotals.length ? (
          <div className="grid gap-4 rounded-app border border-line bg-surface p-4 sm:grid-cols-[180px_1fr]">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    isAnimationActive={false}
                  >
                    {categoryTotals.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value), currency, settings.locale)}
                    contentStyle={{ borderRadius: 8, border: "1px solid rgb(var(--color-line))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid content-center gap-2">
              {categoryTotals.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(item.value, currency, settings.locale)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={BarChart3} title="Charts appear after the first expenses." />
        )}
      </Section>

      <Section title="Recent">
        {recentTransactions.length ? (
          <div className="grid gap-2">
            {recentTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={categories.find((category) => category.id === transaction.categoryId)}
                wallet={wallets.find((wallet) => wallet.id === transaction.walletId)}
                settings={settings}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={PlusCircle}
            title="No transactions yet."
            action={
              <button type="button" onClick={onAdd} className="text-sm font-semibold text-accent">
                Add transaction
              </button>
            }
          />
        )}
      </Section>
    </div>
  );
}
