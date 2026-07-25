import type { Settings, Transaction, Wallet, WalletInput, WalletView } from "@myfinances/types";
import { WalletsView } from "../views/WalletsView";
import { type Dictionary } from "../i18n";
import { MobileWalletPager } from "./MobileWalletPager";

interface MobileWalletsPagerProps {
  wallets: Wallet[];
  transactions: Transaction[];
  settings: Settings;
  activeWalletId: WalletView;
  allLabel: string;
  t: Dictionary;
  onChange: (value: WalletView) => void;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function MobileWalletsPager({
  wallets,
  transactions,
  settings,
  activeWalletId,
  allLabel,
  t,
  onChange,
  onCreate,
  onUpdate,
  onArchive
}: MobileWalletsPagerProps) {
  return (
    <MobileWalletPager
      wallets={wallets}
      activeWalletId={activeWalletId}
      allLabel={allLabel}
      allCurrency={settings.currency}
      eyebrow={t.wallets.title}
      onChange={onChange}
    >
      {(option) => (
        <WalletsView
          wallets={wallets}
          transactions={transactions}
          settings={settings}
          activeWalletId={option.value}
          showTitle={false}
          t={t}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onArchive={onArchive}
        />
      )}
    </MobileWalletPager>
  );
}
