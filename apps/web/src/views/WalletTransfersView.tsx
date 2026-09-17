import { useState } from "react";
import type {
  Settings,
  Wallet,
  WalletTransfer,
  WalletTransferInput
} from "@myfinances/types";
import { formatDate, formatMoney } from "@myfinances/utils";
import { ArrowRight, Plus, Repeat2, Trash2 } from "lucide-react";
import { WalletTransferForm } from "../components/WalletTransferForm";
import { shouldHideWalletAmounts } from "../lib/walletFeatures";
import { BottomSheet } from "../components/ui/BottomSheet";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import type { Dictionary } from "../i18n";

interface WalletTransfersViewProps {
  wallets: Wallet[];
  transfers: WalletTransfer[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: WalletTransferInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function WalletTransfersView({
  wallets,
  transfers,
  settings,
  t,
  onCreate,
  onDelete
}: WalletTransfersViewProps) {
  const [creating, setCreating] = useState(false);
  const canTransfer = wallets.length > 1;

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.wallets.transfers}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {canTransfer ? t.wallets.transferDescription : t.wallets.transferNeedsWallets}
          </p>
        </div>
        <Button
          size="icon"
          disabled={!canTransfer}
          onClick={() => setCreating(true)}
          aria-label={t.wallets.addTransfer}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {transfers.length ? (
        <div className="grid gap-2">
          {transfers.map((transfer) => {
            const fromWallet = wallets.find((wallet) => wallet.id === transfer.fromWalletId);
            const toWallet = wallets.find((wallet) => wallet.id === transfer.toWalletId);
            const hideTransferAmounts =
              shouldHideWalletAmounts(settings, fromWallet) ||
              shouldHideWalletAmounts(settings, toWallet);
            return (
              <article
                key={transfer.id}
                className="app-surface grid gap-3 rounded-2xl p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                    <span className="truncate">{fromWallet?.name ?? t.wallets.walletUnavailable}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
                    <span className="truncate">{toWallet?.name ?? t.wallets.walletUnavailable}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(
                      transfer.transferDate,
                      settings.locale,
                      settings.dateFormat,
                      settings.timeZone
                    )}
                    {transfer.note ? ` · ${transfer.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatMoney(
                        transfer.fromAmountMinor,
                        transfer.fromCurrency,
                        settings.locale,
                        hideTransferAmounts
                      )}
                    </p>
                    {transfer.fromCurrency !== transfer.toCurrency ||
                    transfer.fromAmountMinor !== transfer.toAmountMinor ? (
                      <p className="text-xs text-muted">
                        →{" "}
                        {formatMoney(
                          transfer.toAmountMinor,
                          transfer.toCurrency,
                          settings.locale,
                          hideTransferAmounts
                        )}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm(t.wallets.confirmDeleteTransfer)) {
                        void onDelete(transfer.id);
                      }
                    }}
                    aria-label={t.common.delete}
                  >
                    <Trash2 className="h-4 w-4 text-expense" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Repeat2}
          title={canTransfer ? t.wallets.transferEmpty : t.wallets.transferNeedsWallets}
        />
      )}

      <BottomSheet
        open={creating}
        title={t.wallets.addTransfer}
        onClose={() => setCreating(false)}
      >
        <WalletTransferForm
          wallets={wallets}
          settings={settings}
          t={t}
          onSubmit={async (input) => {
            await onCreate(input);
            setCreating(false);
          }}
        />
      </BottomSheet>
    </div>
  );
}
