import { useEffect, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import type {
  Settings,
  Transaction,
  Wallet,
  WalletInput,
  WalletTransfer,
  WalletView
} from "@myfinances/types";
import { Archive, Edit3, GripVertical, Plus, RotateCcw, WalletCards } from "lucide-react";
import { calculateWalletTotals, formatMoney } from "@myfinances/utils";
import { WalletForm } from "../components/WalletForm";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import type { Dictionary } from "../i18n";
import { WalletIcon } from "../lib/icons";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";

interface WalletsViewProps {
  wallets: Wallet[];
  archivedWallets: Wallet[];
  transactions: Transaction[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  activeWalletId?: WalletView;
  showTitle?: boolean;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

interface ReorderWalletItemProps {
  wallet: Wallet;
  totals: ReturnType<typeof calculateWalletTotals>;
  settings: Settings;
  t: Dictionary;
  canReorder: boolean;
  onEdit: (wallet: Wallet) => void;
  onArchive: (id: string) => Promise<void>;
  onDragEnd?: () => void;
}

function ReorderWalletItem({
  wallet,
  totals,
  settings,
  t,
  canReorder,
  onEdit,
  onArchive,
  onDragEnd
}: ReorderWalletItemProps) {
  const dragControls = useDragControls();
  const advanced = settings.advancedWalletsEnabled;
  const hideWalletAmounts = shouldHideWalletAmounts(settings, wallet);
  const creditUsedMinor = wallet.kind === "credit" ? Math.max(-totals.balanceMinor, 0) : 0;
  const creditAvailableMinor = Math.max(wallet.creditLimitMinor - creditUsedMinor, 0);
  const creditUsage = wallet.creditLimitMinor
    ? Math.min(100, Math.round((creditUsedMinor / wallet.creditLimitMinor) * 100))
    : 0;

  return (
    <Reorder.Item
      key={wallet.id}
      value={wallet.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className="app-surface grid gap-3 rounded-app p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {canReorder ? (
            <button
              type="button"
              onPointerDown={(event) => dragControls.start(event)}
              className="touch-none cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted transition hover:text-foreground focus:outline-none"
              aria-label="Drag to reorder wallet"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-app text-white shadow-[0_8px_18px_rgb(0_0_0/0.16)]"
            style={{ backgroundColor: wallet.color }}
          >
            <WalletIcon name={wallet.icon} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{wallet.name}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <span>{wallet.currency}</span>
              {advanced && wallet.kind === "credit" ? (
                <span className="app-control rounded-full px-2 py-0.5 font-semibold">
                  {t.wallets.kindCredit}
                </span>
              ) : null}
              {advanced && wallet.excludeFromTotals ? (
                <span className="app-control rounded-full px-2 py-0.5 font-semibold">
                  {t.wallets.excludedBadge}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(wallet)} aria-label={t.wallets.editTitle}>
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs uppercase text-muted">{t.common.balance}</p>
          <p className="font-semibold text-foreground">
            {formatMoney(totals.balanceMinor, wallet.currency, settings.locale, hideWalletAmounts)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted">{t.common.income}</p>
          <p className="font-semibold text-income">
            {formatMoney(totals.incomeMinor, wallet.currency, settings.locale, hideWalletAmounts)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted">{t.common.expenses}</p>
          <p className="font-semibold text-expense">
            {formatMoney(totals.expenseMinor, wallet.currency, settings.locale, hideWalletAmounts)}
          </p>
        </div>
      </div>
      {advanced && wallet.kind === "credit" ? (
        <div className="app-control grid gap-2 rounded-app p-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted">{t.wallets.creditUsed}</span>
            <span className="font-semibold text-foreground">
              {formatMoney(creditUsedMinor, wallet.currency, settings.locale, hideWalletAmounts)}
            </span>
          </div>
          <span className="h-1.5 overflow-hidden rounded-full bg-elevated">
            <span
              className="block h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${creditUsage}%` }}
            />
          </span>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted">{t.wallets.creditAvailable}</span>
            <span className="font-semibold text-foreground">
              {formatMoney(creditAvailableMinor, wallet.currency, settings.locale, hideWalletAmounts)}
            </span>
          </div>
        </div>
      ) : null}
      <Button
        variant="secondary"
        size="small"
        onClick={() => void onArchive(wallet.id)}
      >
        {t.wallets.archive}
      </Button>
    </Reorder.Item>
  );
}

export function WalletsView({
  wallets,
  archivedWallets,
  transactions,
  transfers,
  settings,
  t,
  activeWalletId = "all",
  showTitle = true,
  onCreate,
  onUpdate,
  onArchive,
  onRestore,
  onReorder
}: WalletsViewProps) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [walletOrder, setWalletOrder] = useState<string[]>(() => wallets.map((w) => w.id));

  useEffect(() => {
    setWalletOrder(wallets.map((w) => w.id));
  }, [wallets]);

  const walletById = new Map(wallets.map((w) => [w.id, w]));
  const canReorder = Boolean(onReorder && activeWalletId === "all" && wallets.length > 1);
  const visibleWallets =
    activeWalletId === "all" ? wallets : wallets.filter((wallet) => wallet.id === activeWalletId);

  async function handleArchive(walletId: string) {
    setOperationError("");
    if (wallets.length <= 1) {
      setOperationError(t.wallets.cannotArchiveLast);
      return;
    }
    if (window.confirm(t.wallets.confirmArchive)) {
      try {
        await onArchive(walletId);
      } catch {
        setOperationError(t.wallets.archiveError);
      }
    }
  }

  async function saveWalletOrder() {
    if (!onReorder) return;
    try {
      await onReorder(walletOrder);
    } catch {
      setOperationError(t.wallets.saveError || "Unable to save wallet order.");
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        {showTitle ? (
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t.wallets.title}</h2>
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setArchiveOpen(true)}
            aria-label={t.wallets.manageArchive}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={() => setCreating(true)} aria-label={t.wallets.add}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {operationError ? (
        <p className="rounded-app bg-expense/10 px-3 py-2 text-sm font-medium text-expense">
          {operationError}
        </p>
      ) : null}

      {canReorder ? (
        <p className="text-xs text-muted">{t.wallets.reorderHint}</p>
      ) : null}

      {visibleWallets.length ? (
        canReorder ? (
          <Reorder.Group
            axis="y"
            values={walletOrder}
            onReorder={setWalletOrder}
            className="grid gap-2"
          >
            {walletOrder.map((walletId) => {
              const wallet = walletById.get(walletId);
              if (!wallet) return null;
              const totals = calculateWalletTotals(wallet, transactions, transfers);
              return (
                <ReorderWalletItem
                  key={wallet.id}
                  wallet={wallet}
                  totals={totals}
                  settings={settings}
                  t={t}
                  canReorder
                  onEdit={setEditing}
                  onArchive={handleArchive}
                  onDragEnd={() => void saveWalletOrder()}
                />
              );
            })}
          </Reorder.Group>
        ) : (
          <div className="grid gap-2">
            {visibleWallets.map((wallet) => {
              const totals = calculateWalletTotals(wallet, transactions, transfers);
              return (
                <ReorderWalletItem
                  key={wallet.id}
                  wallet={wallet}
                  totals={totals}
                  settings={settings}
                  t={t}
                  canReorder={false}
                  onEdit={setEditing}
                  onArchive={handleArchive}
                />
              );
            })}
          </div>
        )
      ) : (
        <EmptyState icon={WalletCards} title={t.wallets.createEmpty} />
      )}

      <BottomSheet open={creating} title={t.wallets.newTitle} onClose={() => setCreating(false)}>
        <WalletForm
          defaultCurrency={settings.currency}
          advancedWalletsEnabled={settings.advancedWalletsEnabled}
          t={t}
          submitLabel={t.wallets.create}
          onSubmit={async (input) => {
            await onCreate(input);
            setCreating(false);
          }}
        />
      </BottomSheet>

      <BottomSheet open={Boolean(editing)} title={t.wallets.editTitle} onClose={() => setEditing(null)}>
        {editing ? (
          <WalletForm
            initial={editing}
            defaultCurrency={settings.currency}
            advancedWalletsEnabled={settings.advancedWalletsEnabled}
            t={t}
            submitLabel={t.wallets.update}
            onSubmit={async (input) => {
              await onUpdate(editing.id, input);
              setEditing(null);
            }}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        open={archiveOpen}
        title={t.wallets.archiveTitle}
        onClose={() => {
          setArchiveOpen(false);
          setOperationError("");
        }}
      >
        {archivedWallets.length ? (
          <div className="grid gap-2">
            {archivedWallets.map((wallet) => (
              <article
                key={wallet.id}
                className="app-control flex items-center justify-between gap-3 rounded-app p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-app text-white"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <WalletIcon name={wallet.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{wallet.name}</p>
                    <p className="text-xs text-muted">{wallet.currency}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={async () => {
                    setOperationError("");
                    try {
                      await onRestore(wallet.id);
                    } catch {
                      setOperationError(t.wallets.restoreError);
                    }
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.wallets.restore}
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={Archive} title={t.wallets.archiveEmpty} />
        )}
        {operationError ? (
          <p className="mt-3 text-sm font-medium text-expense">{operationError}</p>
        ) : null}
      </BottomSheet>
    </div>
  );
}
