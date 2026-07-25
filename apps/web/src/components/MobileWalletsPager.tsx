import type { Settings, Transaction, Wallet, WalletInput } from "@myfinances/types";
import { WalletsView } from "../views/WalletsView";
import { type Dictionary } from "../i18n";

interface MobileWalletsPagerProps {
  wallets: Wallet[];
  transactions: Transaction[];
  settings: Settings;
  t: Dictionary;
  onCreate: (input: WalletInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<WalletInput>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function MobileWalletsPager({
  wallets,
  transactions,
  settings,
  t,
  onCreate,
  onUpdate,
  onArchive
}: MobileWalletsPagerProps) {
  return (
    <WalletsView
      wallets={wallets}
      transactions={transactions}
      settings={settings}
      t={t}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onArchive={onArchive}
    />
  );
}
